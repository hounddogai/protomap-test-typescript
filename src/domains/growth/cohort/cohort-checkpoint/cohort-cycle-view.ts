import { CohortCycle } from "./cohort-cycle.js";

/** How screens and exports show a cohort cycle. */
export class CohortCycleView {
  codeText: string;
  name: string;
  description: string;
  windowDays: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    description: string,
    windowDays: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.description = description;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toCohortCycleView(item: CohortCycle): CohortCycleView {
  return new CohortCycleView(
    item.code,
    item.name,
    item.description,
    String(item.windowDays),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortCycleViews(items: CohortCycle[]): CohortCycleView[] {
  const views: CohortCycleView[] = [];
  for (const item of items) {
    views.push(toCohortCycleView(item));
  }
  return views;
}

export function sumCohortCycleView(view: CohortCycleView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedWindowDays;
}
