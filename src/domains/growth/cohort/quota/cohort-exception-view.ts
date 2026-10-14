import * as text from "../../../../kit/text.js";
import { CohortException } from "./cohort-exception.js";

/** How screens and exports show a cohort exception. */
export class CohortExceptionView {
  codeText: string;
  name: string;
  unit: string;
  attempts: string;
  endsAt: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    unit: string,
    attempts: string,
    endsAt: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.unit = unit;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toCohortExceptionView(item: CohortException): CohortExceptionView {
  return new CohortExceptionView(
    item.code,
    text.truncate(item.name, 64),
    text.truncate(item.unit, 40),
    String(item.attempts),
    String(item.endsAt),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortExceptionViews(items: CohortException[]): CohortExceptionView[] {
  const views: CohortExceptionView[] = [];
  for (const item of items) {
    views.push(toCohortExceptionView(item));
  }
  return views;
}

export function sumCohortExceptionView(view: CohortExceptionView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedAttempts + parsedEndsAt;
}
