import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CreateTcrDto } from './dtos/createTcr.dto';
import { Fund } from 'src/entities/fund.entity';
import { Tcr } from 'src/entities/tcr.entity';
import { FundTypesEnum } from 'src/enums/fundType.enum';
import { Officer } from 'src/entities/officer.entity';
import { TcrStatus } from 'src/enums/tcrStatus.enum';
import { Station } from 'src/entities/station.entity';
import { User } from 'src/entities/user.entity';
import { TcrOfficerAllocation } from 'src/entities/tcrOfficerAllocation.entity';
import { TcrOfficerRole } from 'src/enums/tcrOfficerRole.enum';

type RoleInput = { role: TcrOfficerRole; officerIds: string[]; fund: number };

@Injectable()
export class TcrService {
  constructor(
    @InjectRepository(Tcr) private readonly tcrRepo: Repository<Tcr>,
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
  ) {}

  async createTcr(payload: CreateTcrDto, userId: string) {
    return this.tcrRepo.manager.transaction(async (manager) => {
      await this.validatePayload(manager, payload, userId);
      const duplicate = await manager
        .getRepository(Tcr)
        .findOne({ where: { tcrNo: payload.trcNumber.trim() } });
      if (duplicate) throw new BadRequestException('TCR number already exists');

      const tcr = this.populateTcr(
        new Tcr(),
        payload,
        await this.getFunds(manager),
        userId,
      );
      tcr.status = TcrStatus.PENDING;
      return this.saveTcrWithAllocations(manager, tcr, payload);
    });
  }

  async getAllTcrDetails() {
    const tcrs = await this.tcrRepo.find();
    return Promise.all(
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
  }

  async approveTcr(tcrId: string, type: TcrStatus, userId: string) {
    if (![TcrStatus.APPROVED, TcrStatus.REJECTED].includes(type)) {
      throw new BadRequestException('Invalid TCR review status');
    }
    const result = await this.tcrRepo.update(
      { id: tcrId },
      { status: type, approvedBy: userId, approvedAt: new Date() },
    );
    if (!result.affected) throw new NotFoundException('TCR not found');
    return {
      status: 'success',
      message: 'TCR status has been changed successfully',
    };
  }

  async getTcrDetails(tcrId: string) {
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
        'officerAllocations',
        'officerAllocations.officer',
        'officerAllocations.officer.designation',
      ],
    });
    if (!tcr) throw new NotFoundException('TCR not found');
    const [station, approver] = await Promise.all([
      this.stationRepo.findOne({ where: { id: tcr.stationId } }),
      tcr.status === TcrStatus.APPROVED && tcr.approvedBy
        ? this.tcrRepo.manager.getRepository(User).findOne({
            where: { id: tcr.approvedBy },
            withDeleted: true,
          })
        : Promise.resolve(null),
    ]);
    return {
      ...tcr,
      stationName: station?.name,
      stationCode: station?.code,
      approverName: approver?.name ?? null,
    };
  }

  async deleteTcr(tcrId: string) {
    const result = await this.tcrRepo.softDelete({ id: tcrId });
    if (!result.affected) throw new NotFoundException('TCR not found');
    return { status: 'success', message: 'TCR deleted successfully' };
  }

  async updateTcr(tcrId: string, payload: CreateTcrDto) {
    return this.tcrRepo.manager.transaction(async (manager) => {
      const tcr = await manager
        .getRepository(Tcr)
        .findOne({ where: { id: tcrId } });
      if (!tcr) throw new NotFoundException('TCR not found');
      await this.validatePayload(manager, payload);

      const duplicate = await manager
        .getRepository(Tcr)
        .findOne({ where: { tcrNo: payload.trcNumber.trim() } });
      if (duplicate && duplicate.id !== tcrId)
        throw new BadRequestException('TCR number already exists');

      this.populateTcr(tcr, payload, await this.getFunds(manager));
      if (tcr.status === TcrStatus.REJECTED) {
        tcr.status = TcrStatus.PENDING;
        tcr.approvedBy = null;
        tcr.approvedAt = null;
      }
      await this.saveTcrWithAllocations(manager, tcr, payload);
      return { status: 'success', message: 'TCR updated successfully' };
    });
  }

  private async saveTcrWithAllocations(
    manager: EntityManager,
    tcr: Tcr,
    payload: CreateTcrDto,
  ) {
    const officers = await this.getValidatedOfficers(manager, payload);
    const savedTcr = await manager.getRepository(Tcr).save(tcr);
    const officerById = new Map(
      officers.map((officer) => [officer.id, officer]),
    );
    const allocations: TcrOfficerAllocation[] = [];

    for (const { role, officerIds, fund } of this.getRoleInputs(
      savedTcr,
      payload,
    )) {
      const roleOfficers = officerIds.map((id) => officerById.get(id)!);
      const totalShare = roleOfficers.reduce(
        (total, officer) => total + Number(officer.designation.fundShare),
        0,
      );
      if (roleOfficers.length && totalShare <= 0) {
        throw new BadRequestException(
          `${role} officers must have a positive designation fund share`,
        );
      }
      for (const officer of roleOfficers) {
        const designationFundShare = Number(officer.designation.fundShare);
        allocations.push(
          manager.getRepository(TcrOfficerAllocation).create({
            tcr: savedTcr,
            officer,
            role,
            designationFundShare,
            payment: (fund * designationFundShare) / totalShare,
          }),
        );
      }
    }

    await manager
      .getRepository(TcrOfficerAllocation)
      .delete({ tcr: { id: savedTcr.id } });
    await manager.getRepository(TcrOfficerAllocation).save(allocations);
    return savedTcr;
  }

  private async validatePayload(
    manager: EntityManager,
    payload: CreateTcrDto,
    userId?: string,
  ) {
    if (!payload?.trcNumber?.trim())
      throw new BadRequestException('TCR number is required');
    if (
      !Number.isFinite(Number(payload.totalCaseAmount)) ||
      Number(payload.totalCaseAmount) <= 0
    ) {
      throw new BadRequestException(
        'Total case amount must be greater than zero',
      );
    }
    if (Number.isNaN(new Date(payload.date).getTime()))
      throw new BadRequestException('A valid incident date is required');
    if (
      !payload.stationId ||
      !(await manager
        .getRepository(Station)
        .exist({ where: { id: payload.stationId } }))
    ) {
      throw new BadRequestException('Station does not exist');
    }
    if (
      userId &&
      !(await manager.getRepository(User).exist({ where: { id: userId } }))
    ) {
      throw new BadRequestException('Creating user does not exist');
    }
    const officerRoles: Array<[TcrOfficerRole, unknown]> = [
      [TcrOfficerRole.DETECTING, payload.detectingOfficers],
      [TcrOfficerRole.INFORMANT, payload.informant],
      [TcrOfficerRole.PROSECUTING, payload.prosecutingOffiers],
      [TcrOfficerRole.PARTICIPATION, payload.participationOfficers],
      [TcrOfficerRole.NON_PARTICIPATION, payload.nonParticipationOfficers],
    ];
    for (const [role, officerIds] of officerRoles) {
      if (!Array.isArray(officerIds))
        throw new BadRequestException(`${role} officers must be an array`);
      if (officerIds.some((id) => !id))
        throw new BadRequestException(`${role} officer ID is invalid`);
      if (new Set(officerIds).size !== officerIds.length)
        throw new BadRequestException(`Duplicate ${role} officer`);
    }
  }

  private async getValidatedOfficers(
    manager: EntityManager,
    payload: CreateTcrDto,
  ) {
    const ids = [
      ...new Set(
        this.getRoleInputs({} as Tcr, payload).flatMap(
          ({ officerIds }) => officerIds,
        ),
      ),
    ];
    if (!ids.length) return [];
    const officers = await manager
      .getRepository(Officer)
      .find({ where: { id: In(ids) }, relations: ['designation'] });
    if (officers.length !== ids.length)
      throw new BadRequestException('One or more officers do not exist');
    if (
      officers.some(
        (officer) =>
          !Number.isFinite(Number(officer.designation?.fundShare)) ||
          Number(officer.designation.fundShare) < 0,
      )
    ) {
      throw new BadRequestException(
        'Every officer must have a valid designation fund share',
      );
    }
    return officers;
  }

  private async getFunds(manager: EntityManager) {
    const funds = await manager.getRepository(Fund).find();
    const fundShare = (fundType: FundTypesEnum) => {
      const value = Number(
        funds.find((fund) => fund.fundType === fundType)?.fundShare,
      );
      if (!Number.isFinite(value) || value < 0)
        throw new BadRequestException(`Invalid ${fundType} fund configuration`);
      return value;
    };
    return {
      specialFund: fundShare(FundTypesEnum.SPECIAL_FUND),
      consolidatedFund: fundShare(FundTypesEnum.CONSOLIDATED_FUND),
      detectingOfficerFund: fundShare(FundTypesEnum.DETECTING_OFFICER),
      participationOfficerFund: fundShare(FundTypesEnum.PARTICIPATION_OFFICERS),
      prosecutingOfficerFund: fundShare(FundTypesEnum.PROSECUTING_OFFICER),
      nonParticipationOfficerFund: fundShare(
        FundTypesEnum.NON_PARTICIPATION_OFFICERS,
      ),
      informantFund: fundShare(FundTypesEnum.INFORMANT_OFFICER),
    };
  }

  private populateTcr(
    tcr: Tcr,
    payload: CreateTcrDto,
    funds: Record<string, number>,
    userId?: string,
  ) {
    const amount = Number(payload.totalCaseAmount);
    tcr.tcrNo = payload.trcNumber.trim();
    tcr.stationId = payload.stationId;
    tcr.totalCaseAmount = amount;
    if (userId) tcr.createdBy = userId;
    tcr.incidentDate = new Date(payload.date);
    tcr.specialFund = (funds.specialFund * amount) / 100;
    tcr.consolidatedFund = (funds.consolidatedFund * amount) / 100;
    tcr.detectingOfficerFund = (funds.detectingOfficerFund * amount) / 100;
    tcr.participationOfficerFund =
      (funds.participationOfficerFund * amount) / 100;
    tcr.prosecutingOfficerFund = (funds.prosecutingOfficerFund * amount) / 100;
    tcr.nonParticipationOfficerFund =
      (funds.nonParticipationOfficerFund * amount) / 100;
    tcr.informantFund = (funds.informantFund * amount) / 100;
    tcr.detectingOfficers = payload.detectingOfficers.map(
      (id) => ({ id }) as Officer,
    );
    tcr.informant = payload.informant.map((id) => ({ id }) as Officer);
    tcr.prosecutingOfficers = payload.prosecutingOffiers.map(
      (id) => ({ id }) as Officer,
    );
    tcr.participationOfficers = payload.participationOfficers.map(
      (id) => ({ id }) as Officer,
    );
    tcr.others = payload.nonParticipationOfficers.map(
      (id) => ({ id }) as Officer,
    );
    return tcr;
  }

  private getRoleInputs(tcr: Tcr, payload: CreateTcrDto): RoleInput[] {
    return [
      {
        role: TcrOfficerRole.DETECTING,
        officerIds: payload.detectingOfficers ?? [],
        fund: Number(tcr.detectingOfficerFund ?? 0),
      },
      {
        role: TcrOfficerRole.INFORMANT,
        officerIds: payload.informant ?? [],
        fund: Number(tcr.informantFund ?? 0),
      },
      {
        role: TcrOfficerRole.PROSECUTING,
        officerIds: payload.prosecutingOffiers ?? [],
        fund: Number(tcr.prosecutingOfficerFund ?? 0),
      },
      {
        role: TcrOfficerRole.PARTICIPATION,
        officerIds: payload.participationOfficers ?? [],
        fund: Number(tcr.participationOfficerFund ?? 0),
      },
      {
        role: TcrOfficerRole.NON_PARTICIPATION,
        officerIds: payload.nonParticipationOfficers ?? [],
        fund: Number(tcr.nonParticipationOfficerFund ?? 0),
      },
    ];
  }
}
