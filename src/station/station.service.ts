import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Station } from 'src/entities/station.entity';
import { CreateStationDto } from 'src/user/dtos/createStation.dto';
import { Repository } from 'typeorm';

@Injectable()
export class StationService {
  constructor(
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
  ) {}
  async createNewStation(
    body: CreateStationDto,
    userId: string,
  ): Promise<Station> {
    const newStation = new Station();

    newStation.code = body.code;
    newStation.name = body.name;
    newStation.address = body.address;
    newStation.createdBy = userId;

    return await this.stationRepo.save(newStation);
  }

  async getAllStations(): Promise<Station[]> {
    return await this.stationRepo.find({
      select: ['id', 'code', 'name', 'address'],
      order: { createdAt: 'DESC' },
    });
  }

  async removeStation(stationId: string): Promise<any> {
    return await this.stationRepo.softDelete({ id: stationId });
  }
}
