import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Fund } from 'src/entities/fund.entity';
import { FundTypesEnum } from 'src/enums/fundType.enum';
import { Repository } from 'typeorm';

@Injectable()
export class FundService {
  constructor(
    @InjectRepository(Fund) private readonly fundRepo: Repository<Fund>,
  ) {}

  async createFund(
    payload: { fundType: FundTypesEnum; fundShare: number },
    id: string,
  ) {
    const newFund = new Fund();
    newFund.fundType = payload.fundType;
    newFund.fundShare = payload.fundShare;
    newFund.updatedBy = id;

    return await this.fundRepo.upsert(newFund, ['fundType']);
  }

  async getAllFunds() {
    return await this.fundRepo.find({
      order: { updatedAt: 'DESC' },
    });
  }
}
