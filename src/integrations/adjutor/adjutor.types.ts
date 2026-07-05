export interface KarmaType {
  karma: string;
}

export interface KarmaIdentityType {
  identity_type: string;
}

export interface ReportingEntity {
  name: string;
  email: string;
}

export interface KarmaRecord {
  karma_identity: string;
  amount_in_contention: string;
  reason: string | null;
  default_date: string;
  karma_type: KarmaType;
  karma_identity_type: KarmaIdentityType;
  reporting_entity: ReportingEntity;
}

export interface KarmaLookupResponse {
  status?: string;
  message?: string;
  data?: KarmaRecord | null;
}
