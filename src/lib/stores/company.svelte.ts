import type { CompanyProfile, TeamMember } from '../types/crm';
import { DEFAULT_COMPANY, DEFAULT_TEAM } from '../data/defaults';

const COMPANY_KEY = 'amasoft_crm_company_v1';
const TEAM_KEY = 'amasoft_crm_team_v1';

const TEAM_COLORS = [
	'#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
	'#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
];

class CompanyState {
	company = $state<CompanyProfile>(DEFAULT_COMPANY);
	team = $state<TeamMember[]>(DEFAULT_TEAM);
	isCompanyModalOpen = $state<boolean>(false);
	isTeamModalOpen = $state<boolean>(false);

	constructor() {
		this.init();
	}

	init() {
		if (typeof window === 'undefined') return;
		try {
			const savedCompany = localStorage.getItem(COMPANY_KEY);
			if (savedCompany) {
				const parsed = JSON.parse(savedCompany);
				if (parsed && typeof parsed.name === 'string') {
					this.company = { ...DEFAULT_COMPANY, ...parsed };
				}
			}
		} catch {}

		try {
			const savedTeam = localStorage.getItem(TEAM_KEY);
			if (savedTeam) {
				const parsed = JSON.parse(savedTeam);
				if (Array.isArray(parsed) && parsed.length > 0) {
					this.team = parsed;
				}
			}
		} catch {}
	}

	private saveCompany() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(COMPANY_KEY, JSON.stringify(this.company));
		} catch {}

		fetch('/api/company', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'company', data: this.company })
		}).catch(() => {});
	}

	private saveTeam() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(TEAM_KEY, JSON.stringify(this.team));
		} catch {}

		fetch('/api/company', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'team', data: this.team })
		}).catch(() => {});
	}

	updateCompany(partial: Partial<CompanyProfile>) {
		this.company = { ...this.company, ...partial };
		this.saveCompany();
	}

	addMember(member: Omit<TeamMember, 'id' | 'color'>) {
		const color = TEAM_COLORS[this.team.length % TEAM_COLORS.length];
		const newMember: TeamMember = {
			...member,
			id: `member-${Date.now()}`,
			color
		};
		this.team = [...this.team, newMember];
		this.saveTeam();
	}

	updateMember(id: string, partial: Partial<TeamMember>) {
		this.team = this.team.map(m => m.id === id ? { ...m, ...partial } : m);
		this.saveTeam();
	}

	deleteMember(id: string) {
		this.team = this.team.filter(m => m.id !== id);
		this.saveTeam();
	}

	toggleMemberActive(id: string) {
		this.team = this.team.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
		this.saveTeam();
	}

	get activeMembers(): TeamMember[] {
		return this.team.filter(m => m.isActive);
	}

	getMemberById(id: string): TeamMember | undefined {
		return this.team.find(m => m.id === id);
	}

	getMemberByName(name: string): TeamMember | undefined {
		return this.team.find(m => m.name.toLowerCase() === name.toLowerCase());
	}

	getRandomColor(): string {
		return TEAM_COLORS[this.team.length % TEAM_COLORS.length];
	}
}

export const companyStore = new CompanyState();
