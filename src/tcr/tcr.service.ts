import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateTcrDto } from './dtos/createTcr.dto';
import { Fund } from 'src/entities/fund.entity';
import { Tcr } from 'src/entities/tcr.entity';
import { FundTypesEnum } from 'src/enums/fundType.enum';
import { Officer } from 'src/entities/officer.entity';
import { TcrStatus } from 'src/enums/tcrStatus.enum';
import { Station } from 'src/entities/station.entity';

@Injectable()
export class TcrService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Fund) private readonly fundRepo: Repository<Fund>,
    @InjectRepository(Tcr) private readonly tcrRepo: Repository<Tcr>,
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
  ) {}

  async createTcr(payload: CreateTcrDto, userId: string) {
    const detectionOfficerIds = payload.detectingOfficers;
    const informantIds = payload.informant;
    const prosecutingOffiersIds = payload.prosecutingOffiers;
    const detectionOthersIds = payload.participationOfficers; //participated other officers
    const othersIds = payload.nonParticipationOfficers; // non-participated

    const fundSharePercentages = await this.fundRepo.find();

    // get Special fund here
    const specialFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.SPECIAL_FUND,
    );
    const consolidatedFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.CONSOLIDATED_FUND,
    );
    const detectionFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.DETECTING_OFFICER,
    );

    const participationOfficerFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.PARTICIPATION_OFFICERS,
    );
    const prosecutingOfficerFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.PROSECUTING_OFFICER,
    );
    const nonParticipationOfficerFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.NON_PARTICIPATION_OFFICERS,
    );
    const informantFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.INFORMANT_OFFICER,
    );

    // Insert data into the tcr table
    const newTcr = new Tcr();

    newTcr.tcrNo = payload.trcNumber;
    newTcr.stationId = payload.stationId;
    newTcr.totalCaseAmount = payload.totalCaseAmount;
    newTcr.createdBy = userId;
    newTcr.specialFund =
      (Number(specialFund?.fundShare) * payload.totalCaseAmount) / 100;
    newTcr.consolidatedFund =
      (Number(consolidatedFund?.fundShare) * payload.totalCaseAmount) / 100;
    newTcr.detectingOfficerFund =
      (Number(detectionFund?.fundShare) * payload.totalCaseAmount) / 100;
    newTcr.participationOfficerFund =
      (Number(participationOfficerFund?.fundShare) * payload.totalCaseAmount) /
      100;
    newTcr.prosecutingOfficerFund =
      (Number(prosecutingOfficerFund?.fundShare) * payload.totalCaseAmount) /
      100;
    newTcr.nonParticipationOfficerFund =
      (Number(nonParticipationOfficerFund?.fundShare) *
        payload.totalCaseAmount) /
      100;
    newTcr.informantFund =
      (Number(informantFund?.fundShare) * payload.totalCaseAmount) / 100;

    //   officers
    newTcr.detectingOfficers = detectionOfficerIds?.map(
      (id) => ({ id }) as Officer,
    );
    newTcr.informant = informantIds?.map((id) => ({ id }) as Officer);
    newTcr.prosecutingOfficers = prosecutingOffiersIds?.map(
      (id) => ({ id }) as Officer,
    );
    newTcr.participationOfficers = detectionOthersIds?.map(
      (id) => ({ id }) as Officer,
    );
    newTcr.others = othersIds?.map((id) => ({ id }) as Officer);

    newTcr.status = TcrStatus.PENDING;

    newTcr.incidentDate = new Date(payload.date);

    return await this.tcrRepo.save(newTcr);
  }

  async getAllTcrDetails() {
    const tcrs = await this.tcrRepo.find();

    const res = await Promise.all(
      tcrs.map(async (tcr) => {
        const station = await this.stationRepo.findOne({
          where: { id: tcr.stationId },
        });

        return {
          ...tcr,
          stationName: station?.name,
          stationCode: station?.code,
        };
      }),
    );

    return res;
  }

  async approveTcr(tcrId: string, type: TcrStatus, userId: string) {
    await this.tcrRepo.update(
      { id: tcrId },
      {
        status: type,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    );

    return {
      status: 'success',
      message: 'TCR status has been changed successfully',
    };
  }

  async getTcrDetails(userId: string, tcrId: string) {
    const tcr = await this.tcrRepo.findOne({
      where: { id: tcrId },
      relations: [
        'detectingOfficers',
        'detectingOfficers.designation',
        'detectingOfficers.stations',
        'detectingOfficers.stations.station',
        'informant',
        'informant.designation',
        'informant.stations',
        'informant.stations.station',
        'prosecutingOfficers',
        'prosecutingOfficers.designation',
        'prosecutingOfficers.stations',
        'prosecutingOfficers.stations.station',
        'participationOfficers',
        'participationOfficers.designation',
        'participationOfficers.stations',
        'participationOfficers.stations.station',
        'others',
        'others.designation',
        'others.stations',
        'others.stations.station',
      ],
    });

    if (!tcr) {
      throw new NotFoundException('TCR not found');
    }

    const station = await this.stationRepo.findOne({
      where: { id: tcr.stationId },
    });

    return {
      ...tcr,
      stationName: station?.name,
      stationCode: station?.code,
    };
  }

  async deleteTcr(tcrId: string) {
    await this.tcrRepo.softDelete({ id: tcrId });
    return { status: 'success', message: 'TCR deleted successfully' };
  }

  async updateTcr(tcrId: string, payload: CreateTcrDto) {
    const tcr = await this.tcrRepo.findOne({ where: { id: tcrId } });

    if (!tcr) {
      throw new NotFoundException('TCR not found');
    }

    const fundSharePercentages = await this.fundRepo.find();

    const specialFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.SPECIAL_FUND,
    );
    const consolidatedFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.CONSOLIDATED_FUND,
    );
    const detectionFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.DETECTING_OFFICER,
    );
    const participationOfficerFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.PARTICIPATION_OFFICERS,
    );
    const prosecutingOfficerFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.PROSECUTING_OFFICER,
    );
    const nonParticipationOfficerFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.NON_PARTICIPATION_OFFICERS,
    );
    const informantFund = fundSharePercentages.find(
      (fund) => fund.fundType === FundTypesEnum.INFORMANT_OFFICER,
    );

    tcr.tcrNo = payload.trcNumber;
    tcr.stationId = payload.stationId;
    tcr.totalCaseAmount = payload.totalCaseAmount;
    tcr.specialFund =
      (Number(specialFund?.fundShare) * payload.totalCaseAmount) / 100;
    tcr.consolidatedFund =
      (Number(consolidatedFund?.fundShare) * payload.totalCaseAmount) / 100;
    tcr.detectingOfficerFund =
      (Number(detectionFund?.fundShare) * payload.totalCaseAmount) / 100;
    tcr.participationOfficerFund =
      (Number(participationOfficerFund?.fundShare) * payload.totalCaseAmount) /
      100;
    tcr.prosecutingOfficerFund =
      (Number(prosecutingOfficerFund?.fundShare) * payload.totalCaseAmount) /
      100;
    tcr.nonParticipationOfficerFund =
      (Number(nonParticipationOfficerFund?.fundShare) *
        payload.totalCaseAmount) /
      100;
    tcr.informantFund =
      (Number(informantFund?.fundShare) * payload.totalCaseAmount) / 100;
    tcr.detectingOfficers = payload.detectingOfficers?.map(
      (id) => ({ id }) as Officer,
    );
    tcr.informant = payload.informant?.map((id) => ({ id }) as Officer);
    tcr.prosecutingOfficers = payload.prosecutingOffiers?.map(
      (id) => ({ id }) as Officer,
    );
    tcr.participationOfficers = payload.participationOfficers?.map(
      (id) => ({ id }) as Officer,
    );
    tcr.others = payload.nonParticipationOfficers?.map(
      (id) => ({ id }) as Officer,
    );
    tcr.incidentDate = new Date(payload.date);

    await this.tcrRepo.save(tcr);

    return { status: 'success', message: 'TCR updated successfully' };
  }
}
