import { SlaPlan } from "./sla-plan.js";

/** How screens and exports show a sla plan. */
export class SlaPlanView {
  code: string;
  titleText: string;
  timezoneText: string;
  revision: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezoneText: string,
    revision: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezoneText = timezoneText;
    this.revision = revision;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toSlaPlanView(item: SlaPlan): SlaPlanView {
  return new SlaPlanView(
    item.code,
    item.title,
    item.timezone,
    String(item.revision),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaPlanViews(items: SlaPlan[]): SlaPlanView[] {
  const views: SlaPlanView[] = [];
  for (const item of items) {
    views.push(toSlaPlanView(item));
  }
  return views;
}

export function sumSlaPlanView(view: SlaPlanView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRevision + parsedSequence;
}
