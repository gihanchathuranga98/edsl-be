export interface CreateTcrDto {
  trcNumber: string;
  date: Date;
  stationId: string;
  totalCaseAmount: number;
  detectingOfficers: string[];
  informant: string[];
  prosecutingOffiers: string[];
  participationOfficers: string[];
  nonParticipationOfficers: string[];
}
