import * as text from "../../../../kit/text.js";

/** Where a creative window is in its life cycle. */
export type CreativeWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A creative window as the creative team keeps it. */
export class CreativeWindow {
  code: string;
  title: string;
  ratio: number;
  rate: number;
  attributes: Map<string, string>;
  ownerId: string;
  priority: number;
  locale: string;
  name: string;
  notes: string;
  status: CreativeWindowStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    rate: number,
    attributes: Map<string, string>,
    ownerId: string,
    priority: number,
    locale: string,
    name: string,
    notes: string,
    status: CreativeWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.rate = rate;
    this.attributes = attributes;
    this.ownerId = ownerId;
    this.priority = priority;
    this.locale = locale;
    this.name = name;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CreativeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"creative window"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round(this.priority * this.ratio * 100) / 100;
  }

  copy(): CreativeWindow {
    return new CreativeWindow(
      this.code,
      this.title,
      this.ratio,
      this.rate,
      this.attributes,
      this.ownerId,
      this.priority,
      this.locale,
      this.name,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative window in status proposed. */
export function newCreativeWindow(code: string, title: string): CreativeWindow {
  return new CreativeWindow(code, title, 0, 0, new Map<string, string>(), "", 0, "", "", "", "proposed");
}
