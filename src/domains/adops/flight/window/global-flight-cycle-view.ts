import * as text from "../../../../kit/text.js";
import { GlobalFlightCycle } from "./global-flight-cycle.js";

/** How screens and exports show a global flight cycle. */
export class GlobalFlightCycleView {
  codeText: string;
  labelText: string;
  notesText: string;
  active: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    notesText: string,
    active: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.notesText = notesText;
    this.active = active;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFlightCycleView(item: GlobalFlightCycle): GlobalFlightCycleView {
  return new GlobalFlightCycleView(
    text.truncate(item.code, 40),
    item.label,
    item.notes,
    `${item.active}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFlightCycleViews(items: GlobalFlightCycle[]): GlobalFlightCycleView[] {
  const views: GlobalFlightCycleView[] = [];
  for (const item of items) {
    views.push(toGlobalFlightCycleView(item));
  }
  return views;
}

export function sumGlobalFlightCycleView(view: GlobalFlightCycleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
