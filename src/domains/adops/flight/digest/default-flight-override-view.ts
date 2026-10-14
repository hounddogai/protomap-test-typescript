import * as text from "../../../../kit/text.js";
import { DefaultFlightOverride } from "./default-flight-override.js";

/** How screens and exports show a default flight override. */
export class DefaultFlightOverrideView {
  code: string;
  name: string;
  pinnedText: string;
  ceilingText: string;
  visible: string;
  channel: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    pinnedText: string,
    ceilingText: string,
    visible: string,
    channel: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.pinnedText = pinnedText;
    this.ceilingText = ceilingText;
    this.visible = visible;
    this.channel = channel;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFlightOverrideView(item: DefaultFlightOverride): DefaultFlightOverrideView {
  return new DefaultFlightOverrideView(
    item.code,
    text.truncate(item.name, 64),
    `${item.pinned}`,
    item.ceiling.toFixed(2),
    `${item.visible}`,
    item.channel,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFlightOverrideViews(items: DefaultFlightOverride[]): DefaultFlightOverrideView[] {
  const views: DefaultFlightOverrideView[] = [];
  for (const item of items) {
    views.push(toDefaultFlightOverrideView(item));
  }
  return views;
}

export function sumDefaultFlightOverrideView(view: DefaultFlightOverrideView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCeiling;
}
