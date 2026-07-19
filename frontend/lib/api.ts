export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface Carrier {
  dotNumber: string;
  mcNumber: string;
  legalName: string;
  dbaName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  safetyRating: string;
  safetyRatingDate: string;
  reviewDate: string;
  authorityStatus: string;
  authorityType: string;
  authorityAge: string;
  outOfServiceRate: string;
  outOfServiceNationalAvg: string;
  driverOOSRate: string;
  vehicleOOSRate: string;
  crashTotal: number;
  fatalCrashes: number;
  injuryCrashes: number;
  towCrashes: number;
  inspections: number;
  violations: number;
  vehicleInspections: number;
  driverInspections: number;
  hazmatStatus: boolean;
  insurance: InsuranceRecord[];
  fleetSize: number;
  powerUnits: number;
  drivers: number;
  operationType: string;
  cargoTypes: string[];
  riskScore: number;
  riskBreakdown: RiskFactor[];
  recommendation: string;
  oosComparison: string;
  lastUpdated: string;
  dataSource: string;
  aiSummary: string;
}

export interface InsuranceRecord {
  policyType: string;
  carrier: string;
  limit: string;
  expiration: string;
  status: string;
}

export interface SearchHistoryItem {
  id: string;
  mc_number: string;
  dot_number: string;
  carrier_name: string;
  risk_score: number;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit & { token?: string | null }): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const { token, body: reqBody, ...fetchOptions } = options || {};

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    body: reqBody ?? undefined,
    ...fetchOptions,
  });

  const body = await res.json();

  if (!res.ok) {
    throw new ApiError(body.error || 'Request failed', res.status);
  }

  return body.data as T;
}

export async function searchCarrier(
  params: {
    mcNumber?: string;
    dotNumber?: string;
    filters?: {
      authorityStatus?: string;
      safetyRating?: string;
      hazmatCertified?: boolean;
    };
  },
  token?: string | null
): Promise<Carrier> {
  return request<Carrier>('/carrier/search', {
    method: 'POST',
    body: JSON.stringify(params),
    token,
  });
}

export async function getCarrierById(id: string, type?: 'mc' | 'dot', token?: string | null): Promise<Carrier> {
  const query = type ? `?type=${type}` : '';
  return request<Carrier>(`/carrier/${id}${query}`, { token });
}

export async function getSearchHistory(limit = 10, token?: string | null): Promise<SearchHistoryItem[]> {
  return request<SearchHistoryItem[]>(`/carrier/history?limit=${limit}`, { token });
}

export interface DashboardStats {
  totalCarriersVetted: number;
  highRiskAlerts: number;
  complianceRate: number;
  pendingAudits: number;
  averageRiskScore: number;
  recentChecks: {
    id: string;
    carrier_name: string;
    mc_number: string;
    dot_number: string;
    risk_score: number;
    created_at: string;
  }[];
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
  };
}

export async function getDashboardStats(token?: string | null): Promise<DashboardStats> {
  return request<DashboardStats>('/dashboard/stats', { token });
}

export interface UserProfile {
  name: string;
  email: string;
}

export async function getUserProfile(token?: string | null): Promise<UserProfile> {
  return request<UserProfile>('/users/me', { token });
}

export async function updateUserProfile(data: Partial<UserProfile>, token?: string | null): Promise<UserProfile> {
  return request<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(data), token });
}

export function getPdfDownloadUrl(dotNumber?: string, mcNumber?: string): string {
  const params = new URLSearchParams();
  if (dotNumber) params.set('dotNumber', dotNumber);
  if (mcNumber) params.set('mcNumber', mcNumber);
  return `${API_BASE}/reports/pdf?${params.toString()}`;
}

export async function clearSearchHistory(token?: string | null): Promise<void> {
  await request<null>('/carrier/history', { method: 'DELETE', token });
}

export { ApiError };
