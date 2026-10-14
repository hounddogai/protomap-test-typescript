import { ProofAudit } from "./proof-audit.js";

/** How screens and exports show a proof audit. */
export class ProofAuditView {
  codeText: string;
  title: string;
  budget: string;
  journeyId: string;
  visibleText: string;
  minimumText: string;
  ceiling: string;
  versionText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budget: string,
    journeyId: string,
    visibleText: string,
    minimumText: string,
    ceiling: string,
    versionText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budget = budget;
    this.journeyId = journeyId;
    this.visibleText = visibleText;
    this.minimumText = minimumText;
    this.ceiling = ceiling;
    this.versionText = versionText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toProofAuditView(item: ProofAudit): ProofAuditView {
  return new ProofAuditView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    item.journeyId,
    `${item.visible}`,
    item.minimum.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.version),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofAuditViews(items: ProofAudit[]): ProofAuditView[] {
  const views: ProofAuditView[] = [];
  for (const item of items) {
    views.push(toProofAuditView(item));
  }
  return views;
}

export function sumProofAuditView(view: ProofAuditView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedBudget + parsedMinimum + parsedCeiling;
}
