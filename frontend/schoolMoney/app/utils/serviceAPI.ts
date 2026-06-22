// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: "ROLE_PARENT" | "ROLE_ADMIN";
  virtualAccountNumber: string;
  balance: number;
  blocked: boolean;
}

export interface AuthResponse {
  token: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ROLE_PARENT" | "ROLE_ADMIN";
}

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: "ROLE_PARENT" | "ROLE_ADMIN";
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  dateOfBirth: string;
  parentId: string;
  classId?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  treasurerId: string;
  inviteToken: string;
}

export interface Fundraiser {
  id: string;
  classId: string;
  creatorId: string;
  title: string;
  description: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  amountPerChild: number;
  virtualAccountNumber: string;
  balance: number;
  status: "ACTIVE" | "CLOSED";
  receiptUrls: string[];
  blocked: boolean;
  public: boolean;
}

export interface Transaction {
  id: string;
  fromAccountNumber?: string;
  toAccountNumber?: string;
  amount: number;
  type: "DEPOSIT" | "PAYMENT_FOR_CHILD" | "WITHDRAWAL" | "REFUND" | "EXTERNAL_WITHDRAWAL";
  fundraiserId?: string;
  classId?: string;
  childId?: string;
  payerId?: string;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  classId?: string;
  content: string;
  timestamp: string;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const TOKEN_KEY = "sm_token";
const USER_KEY = "sm_user";

// ─── API Client ──────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): AuthResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    try {
      const json = JSON.parse(text);
      if (json.message && json.message !== "No message available") {
        throw new Error(json.message);
      } else if (json.error) {
        throw new Error(json.error);
      }
    } catch (e) {
      if (e instanceof Error && e.message !== "Unexpected end of JSON input" && e.message !== "Unexpected token < in JSON at position 0" && !e.message.startsWith("JSON.parse")) {
        throw e;
      }
    }
    throw new Error(text || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return {} as T;
}

// ─── Exported API ────────────────────────────────────────────────────────────

export const api = {
  // ── Auth ──
  isAuthenticated(): boolean {
    return !!getToken();
  },

  // ── File Upload ──
  async uploadImage(file: File): Promise<{ url: string }> {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Upload failed");
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || "Upload failed");
      } catch (e) {
        if (e instanceof Error && !e.message.startsWith("Unexpected")) throw e;
      }
      throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
  },

  getUser(): AuthResponse | null {
    return getStoredUser();
  },

  getToken(): string | null {
    return getToken();
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    return res;
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role?: "ROLE_PARENT" | "ROLE_ADMIN";
  }): Promise<User> {
    return request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // ── Children ──
  async getMyChildren(): Promise<Child[]> {
    return request<Child[]>("/api/children");
  },
  async getClassChildren(classId: string): Promise<Child[]> {
    return request<Child[]>(`/api/children/class/${classId}`);
  },

  // ── Users ──
  async getMe(): Promise<User> {
    return request<User>("/api/users/me");
  },

  async getUsers(): Promise<UserSummary[]> {
    return request<UserSummary[]>("/api/users");
  },

  async addChild(data: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    dateOfBirth: string;
  }): Promise<Child> {
    return request<Child>("/api/children", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async assignChildToClass(childId: string, inviteToken: string): Promise<Child> {
    return request<Child>(`/api/children/${childId}/join/${inviteToken}`, {
      method: "POST",
    });
  },

  async leaveClass(childId: string): Promise<Child> {
    return request<Child>(`/api/children/${childId}/leave-class`, { method: "POST" });
  },

  async updateProfile(data: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    // Refresh stored user data
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    return res;
  },

  async updateChild(
    childId: string,
    data: { firstName: string; lastName: string; avatarUrl?: string }
  ): Promise<Child> {
    return request<Child>(`/api/children/${childId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteChild(childId: string): Promise<void> {
    return request<void>(`/api/children/${childId}`, {
      method: "DELETE",
    });
  },

  // ── Classes ──
  async getMyClasses(): Promise<SchoolClass[]> {
    return request<SchoolClass[]>("/api/classes/my");
  },

  async createClass(data: { name: string }): Promise<SchoolClass> {
    return request<SchoolClass>("/api/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getClassByToken(token: string): Promise<SchoolClass> {
    return request<SchoolClass>(`/api/classes/token/${token}`);
  },

  // ── Fundraisers ──
  async getClassFundraisers(classId: string): Promise<Fundraiser[]> {
    return request<Fundraiser[]>(`/api/fundraisers/class/${classId}`);
  },

  async createFundraiser(data: {
    classId: string;
    title: string;
    description: string;
    logoUrl?: string;
    startDate: string;
    endDate: string;
    amountPerChild: number;
    isPublic?: boolean;
  }): Promise<Fundraiser> {
    return request<Fundraiser>("/api/fundraisers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async addReceipt(fundraiserId: string, receiptUrl: string): Promise<Fundraiser> {
    return request<Fundraiser>(
      `/api/fundraisers/${fundraiserId}/receipt?receiptUrl=${encodeURIComponent(receiptUrl)}`,
      { method: "PATCH" }
    );
  },

  async closeFundraiser(fundraiserId: string): Promise<Fundraiser> {
    return request<Fundraiser>(`/api/fundraisers/${fundraiserId}/close`, {
      method: "PATCH",
    });
  },

  // ── Transactions ──
  async deposit(amount: number): Promise<User> {
    return request<User>("/api/transactions/deposit", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  async payForChild(fundraiserId: string, childId: string): Promise<Transaction> {
    return request<Transaction>("/api/transactions/pay", {
      method: "POST",
      body: JSON.stringify({ fundraiserId, childId }),
    });
  },

  async withdraw(fundraiserId: string, amount: number, external: boolean): Promise<Transaction> {
    return request<Transaction>("/api/transactions/withdraw", {
      method: "POST",
      body: JSON.stringify({ fundraiserId, amount, external }),
    });
  },

  async refundPayment(fundraiserId: string, childId: string): Promise<Transaction> {
    return request<Transaction>(`/api/transactions/refund/${fundraiserId}/${childId}`, { method: "POST" });
  },

  async getFundraiserTransactions(fundraiserId: string): Promise<Transaction[]> {
    return request<Transaction[]>(`/api/transactions/fundraiser/${fundraiserId}`);
  },

  async getClassTransactions(classId: string): Promise<Transaction[]> {
    return request<Transaction[]>(`/api/transactions/class/${classId}`);
  },

  // ── Messages ──
  async getClassMessages(classId: string): Promise<Message[]> {
    return request<Message[]>(`/api/messages/class/${classId}`);
  },

  async getPrivateMessages(): Promise<Message[]> {
    return request<Message[]>("/api/messages/private");
  },

  // ── Admin ──
  async getAllUsers(): Promise<User[]> {
    return request<User[]>("/api/admin/users");
  },

  async getAllTreasurers(): Promise<User[]> {
    return request<User[]>("/api/admin/treasurers");
  },

  async toggleUserBlock(userId: string): Promise<User> {
    return request<User>(`/api/admin/users/${userId}/block`, { method: "PATCH" });
  },

  async getAllFundraisers(): Promise<Fundraiser[]> {
    return request<Fundraiser[]>("/api/admin/fundraisers");
  },

  async toggleFundraiserBlock(fundraiserId: string): Promise<Fundraiser> {
    return request<Fundraiser>(`/api/admin/fundraisers/${fundraiserId}/block`, {
      method: "PATCH",
    });
  },

  async getAdminFundraiserReport(fundraiserId: string): Promise<Transaction[]> {
    return request<Transaction[]>(`/api/admin/reports/fundraiser/${fundraiserId}`);
  },

  async getAdminClassReport(classId: string): Promise<Transaction[]> {
    return request<Transaction[]>(`/api/admin/reports/class/${classId}`);
  },

  async getAdminClasses(): Promise<SchoolClass[]> {
    return request<SchoolClass[]>("/api/admin/classes");
  },

  async getAdminChildren(): Promise<Child[]> {
    return request<Child[]>("/api/admin/children");
  },
};
