import * as text from "../../../../kit/text.js";
import { FallbackCohortRequest } from "./fallback-cohort-request.js";

/** How screens and exports show a fallback cohort request. */
export class FallbackCohortRequestView {
  code: string;
  nameText: string;
  visible: string;
  journeyId: string;
  description: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    visible: string,
    journeyId: string,
    description: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.visible = visible;
    this.journeyId = journeyId;
    this.description = description;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCohortRequestView(item: FallbackCohortRequest): FallbackCohortRequestView {
  return new FallbackCohortRequestView(
    item.code,
    text.truncate(item.name, 120),
    `${item.visible}`,
    item.journeyId,
    item.description,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCohortRequestViews(items: FallbackCohortRequest[]): FallbackCohortRequestView[] {
  const views: FallbackCohortRequestView[] = [];
  for (const item of items) {
    views.push(toFallbackCohortRequestView(item));
  }
  return views;
}

export function sumFallbackCohortRequestView(view: FallbackCohortRequestView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
