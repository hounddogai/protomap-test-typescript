import * as text from "../../../../kit/text.js";
import { StrictReputationException } from "./strict-reputation-exception.js";

/** How screens and exports show a strict reputation exception. */
export class StrictReputationExceptionView {
  code: string;
  name: string;
  contactEmail: string;
  phone: string;
  title: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    phone: string,
    title: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.title = title;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictReputationExceptionView(item: StrictReputationException): StrictReputationExceptionView {
  return new StrictReputationExceptionView(
    item.code,
    text.truncate(item.name, 64),
    item.contactEmail,
    text.truncate(item.phone, 40),
    text.truncate(item.title, 64),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictReputationExceptionViews(items: StrictReputationException[]): StrictReputationExceptionView[] {
  const views: StrictReputationExceptionView[] = [];
  for (const item of items) {
    views.push(toStrictReputationExceptionView(item));
  }
  return views;
}

export function sumStrictReputationExceptionView(view: StrictReputationExceptionView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedEndsAt;
}
