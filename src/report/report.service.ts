import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TcrOfficerAllocation } from 'src/entities/tcrOfficerAllocation.entity';
import { Station } from 'src/entities/station.entity';
import { TcrStatus } from 'src/enums/tcrStatus.enum';
import { Tcr } from 'src/entities/tcr.entity';

type DateRange = {
  startDate: string;
  endDate: string;
};

type OfficerReportRow = {
  officerId: string;
  officerName: string;
  tcrNumber: string;
  roles: Array<{ role: string; reward: number }>;
};

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(TcrOfficerAllocation)
    private readonly allocationRepo: Repository<TcrOfficerAllocation>,
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
    @InjectRepository(Tcr)
    private readonly tcrRepo: Repository<Tcr>,
  ) {}

  async getOfficerHandlingTypeSummary({ startDate, endDate }: DateRange) {
    const range = this.validateDateRange(startDate, endDate);
    const allocations = await this.allocationRepo.find({
      where: {
        tcr: {
          incidentDate: Between(range.start, range.end),
          status: TcrStatus.APPROVED,
        },
      },
      relations: ['tcr', 'officer'],
      order: { createdAt: 'ASC' },
    });

    const stationIds = [
      ...new Set(allocations.map((allocation) => allocation.tcr.stationId)),
    ];
    const stations = stationIds.length
      ? await this.stationRepo.findByIds(stationIds)
      : [];
    const stationById = new Map(
      stations.map((station) => [station.id, station]),
    );
    const rowsByStation = new Map<string, Map<string, OfficerReportRow>>();

    for (const allocation of allocations) {
      const stationId = allocation.tcr.stationId;
      const rowKey = `${allocation.officer.id}:${allocation.tcr.id}`;
      const stationRows =
        rowsByStation.get(stationId) ?? new Map<string, OfficerReportRow>();
      const row = stationRows.get(rowKey) ?? {
        officerId: allocation.officer.id,
        officerName: allocation.officer.name,
        tcrNumber: allocation.tcr.tcrNo,
        roles: [],
      };

      row.roles.push({
        role: this.formatRole(allocation.role),
        reward: Number(allocation.payment),
      });
      stationRows.set(rowKey, row);
      rowsByStation.set(stationId, stationRows);
    }

    const stationsReport = [...rowsByStation.entries()]
      .map(([stationId, rows]) => {
        const officers = [...rows.values()];
        const totalReward = officers.reduce(
          (total, officer) =>
            total + officer.roles.reduce((sum, role) => sum + role.reward, 0),
          0,
        );
        const station = stationById.get(stationId);

        return {
          stationId,
          stationName: station?.name ?? 'Unknown station',
          stationCode: station?.code ?? null,
          totalReward,
          officers,
        };
      })
      .sort((first, second) =>
        first.stationName.localeCompare(second.stationName),
      );

    return {
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      stations: stationsReport,
    };
  }

  async getTotalTcrSummary({ startDate, endDate }: DateRange) {
    const range = this.validateDateRange(startDate, endDate);
    const tcrs = await this.tcrRepo.find({
      where: {
        incidentDate: Between(range.start, range.end),
        status: TcrStatus.APPROVED,
      },
      select: {
        id: true,
        totalCaseAmount: true,
        specialFund: true,
        consolidatedFund: true,
        detectingOfficerFund: true,
        informantFund: true,
        prosecutingOfficerFund: true,
        participationOfficerFund: true,
        nonParticipationOfficerFund: true,
      },
    });

    const summary = tcrs.reduce(
      (totals, tcr) => {
        totals.totalTcrValue += Number(tcr.totalCaseAmount);
        totals.specialFunds += Number(tcr.specialFund);
        totals.consolidatedFunds += Number(tcr.consolidatedFund);
        totals.detectionFunds += Number(tcr.detectingOfficerFund);
        totals.informationFunds += Number(tcr.informantFund);
        totals.prosecutingFunds += Number(tcr.prosecutingOfficerFund);
        totals.participationOfficerFunds += Number(
          tcr.participationOfficerFund,
        );
        totals.nonParticipationOfficerFunds += Number(
          tcr.nonParticipationOfficerFund,
        );
        return totals;
      },
      {
        totalTcrValue: 0,
        specialFunds: 0,
        consolidatedFunds: 0,
        detectionFunds: 0,
        informationFunds: 0,
        prosecutingFunds: 0,
        participationOfficerFunds: 0,
        nonParticipationOfficerFunds: 0,
      },
    );
    const totalFunds =
      summary.specialFunds +
      summary.consolidatedFunds +
      summary.detectionFunds +
      summary.informationFunds +
      summary.prosecutingFunds +
      summary.participationOfficerFunds +
      summary.nonParticipationOfficerFunds;

    return {
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      numberOfTcr: tcrs.length,
      ...summary,
      totalFunds,
      difference: summary.totalTcrValue - totalFunds,
    };
  }

  async getAllTcrsReport({ startDate, endDate }: DateRange) {
    const range = this.validateDateRange(startDate, endDate);
    const tcrs = await this.tcrRepo.find({
      where: { createdAt: Between(range.start, range.end) },
      select: {
        id: true,
        stationId: true,
        tcrNo: true,
        createdAt: true,
        totalCaseAmount: true,
      },
      order: { createdAt: 'ASC', tcrNo: 'ASC' },
    });
    const stationIds = [...new Set(tcrs.map((tcr) => tcr.stationId))];
    const stations = stationIds.length
      ? await this.stationRepo.findByIds(stationIds)
      : [];
    const stationById = new Map(
      stations.map((station) => [station.id, station]),
    );

    return {
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      tcrs: tcrs.map((tcr, index) => {
        const station = stationById.get(tcr.stationId);
        return {
          index: index + 1,
          branch: station
            ? `${station.code} - ${station.name}`
            : 'Unknown branch',
          tcrNumber: tcr.tcrNo,
          createdDate: tcr.createdAt.toISOString(),
          amount: Number(tcr.totalCaseAmount),
        };
      }),
    };
  }

  private validateDateRange(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Valid startDate and endDate are required');
    }
    if (start > end) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    return { start, end };
  }

  private formatRole(role: string) {
    return role
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
