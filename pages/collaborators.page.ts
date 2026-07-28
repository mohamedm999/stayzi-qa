import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@lib/logger';

export type CollaboratorType = 'Jardinier' | 'Agent de sécurité' | 'Femme de ménage' | 'Pisciniste';

export interface InviteCollaboratorData {
  firstName: string;
  lastName: string;
  phone: string;
  type: CollaboratorType;
}

export class CollaboratorsPage extends BasePage {
  readonly heading: Locator;
  readonly description: Locator;
  readonly inviteBtn: Locator;

  readonly statTotal: Locator;
  readonly statActifs: Locator;
  readonly statEnAttente: Locator;
  readonly statSuspendus: Locator;

  readonly searchInput: Locator;
  readonly filterBtn: Locator;

  readonly chartRepartition: Locator;
  readonly chartCategorie: Locator;

  readonly emptyState: Locator;
  readonly emptyStateMessage: Locator;
  readonly totalCount: Locator;

  readonly inviteDrawer: Locator;
  readonly inviteDrawerTitle: Locator;
  readonly inviteFirstName: Locator;
  readonly inviteLastName: Locator;
  readonly invitePhone: Locator;
  readonly inviteType: Locator;
  readonly inviteCancelBtn: Locator;
  readonly inviteSubmitBtn: Locator;

  readonly categoryTabJardinier: Locator;
  readonly categoryTabSecurite: Locator;
  readonly categoryTabMenage: Locator;
  readonly categoryTabPisciniste: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: 'Collaborateurs', level: 1 });
    this.description = page.getByText('Invitez et gérez vos jardiniers');
    this.inviteBtn = page.getByRole('button', { name: 'Inviter un collaborateur' });

    this.statTotal = page.getByText('Total', { exact: true });
    this.statActifs = page.getByText('Actifs', { exact: true });
    this.statEnAttente = page.getByText('En attente', { exact: true });
    this.statSuspendus = page.getByText('Suspendus', { exact: true });

    this.searchInput = page.locator('input[placeholder*="Rechercher"]');
    this.filterBtn = page.getByRole('button', { name: 'Filtres' });

    this.chartRepartition = page.getByText('Répartition par statut');
    this.chartCategorie = page.getByText('Collaborateurs par catégorie');

    this.emptyState = page.getByText('Aucun collaborateur pour le moment');
    this.emptyStateMessage = page.getByText('Cliquez sur');
    this.totalCount = page.getByText('collaborateur au total');

    this.inviteDrawer = page.locator('[role="dialog"]');
    this.inviteDrawerTitle = page.locator('[role="dialog"] h2');
    this.inviteFirstName = page.locator('#firstName');
    this.inviteLastName = page.locator('#lastName');
    this.invitePhone = page.locator('#phone');
    this.inviteType = page.locator('select');
    this.inviteCancelBtn = page.locator('[role="dialog"] button:has-text("Annuler")');
    this.inviteSubmitBtn = page.locator('[role="dialog"] button:has-text("Envoyer")');

    this.categoryTabJardinier = page.locator('text=Jardinier').first();
    this.categoryTabSecurite = page.locator('text=Agent desécurité').first();
    this.categoryTabMenage = page.locator('text=Femme deménage').first();
    this.categoryTabPisciniste = page.locator('text=Pisciniste').first();
  }

  async goto(): Promise<void> {
    logger.step('Navigating to collaborators');
    await this.page.goto('/concierge/collaborators', { waitUntil: 'domcontentloaded' });
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickInvite(): Promise<void> {
    logger.step('Clicking Inviter un collaborateur');
    await this.inviteBtn.click();
    await this.inviteDrawer.waitFor({ state: 'visible', timeout: 5000 });
  }

  async fillInviteForm(data: InviteCollaboratorData): Promise<void> {
    logger.step(`Filling invite form for ${data.firstName} ${data.lastName}`);
    await this.inviteFirstName.fill(data.firstName);
    await this.inviteLastName.fill(data.lastName);
    await this.invitePhone.fill(data.phone);
    await this.inviteType.selectOption(data.type);
  }

  async submitInvite(): Promise<void> {
    logger.step('Submitting invite');
    await this.inviteSubmitBtn.click();
  }

  async cancelInvite(): Promise<void> {
    logger.step('Cancelling invite');
    await this.inviteCancelBtn.click();
  }

  async getStatValue(stat: Locator): Promise<string> {
    // The stat card parent contains label + value as siblings
    const card = stat.locator('..').locator('..');
    const value = card.locator('[class*="text-2xl"]');
    return (await value.textContent()) || '';
  }

  async getTotalCount(): Promise<string> {
    return (await this.totalCount.textContent()) || '';
  }

  async search(query: string): Promise<void> {
    logger.step(`Searching collaborators: "${query}"`);
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async isDrawerVisible(): Promise<boolean> {
    try {
      return await this.inviteDrawer.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }
}
