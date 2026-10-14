import * as text from "../../../../kit/text.js";
import { FlightCheckpoint } from "./flight-checkpoint.js";

/** How screens and exports show a flight checkpoint. */
export class FlightCheckpointView {
  code: string;
  label: string;
  priority: string;
  name: string;
  channel: string;
  statusLabel: string;

  constructor(code: string, label: string, priority: string, name: string, channel: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.name = name;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toFlightCheckpointView(item: FlightCheckpoint): FlightCheckpointView {
  return new FlightCheckpointView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    String(item.priority),
    text.truncate(item.name, 80),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightCheckpointViews(items: FlightCheckpoint[]): FlightCheckpointView[] {
  const views: FlightCheckpointView[] = [];
  for (const item of items) {
    views.push(toFlightCheckpointView(item));
  }
  return views;
}

export function sumFlightCheckpointView(view: FlightCheckpointView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
