import * as text from "../../../../kit/text.js";

/** Where a creative tier is in its life cycle. */
export type CreativeTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** One creative tier, with what the planners need to act on it. */
export class CreativeTier {
  code: string;
  name: string;
  retries: number;
  archived: boolean;
  amount: number;
  sequence: number;
  locale: string;
  sendAt: number;
  unit: string;
  attributes: Map<string, string>;
  ceiling: number;
  status: CreativeTierStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    archived: boolean,
    amount: number,
    sequence: number,
    locale: string,
    sendAt: number,
    unit: string,
    attributes: Map<string, string>,
    ceiling: number,
    status: CreativeTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.archived = archived;
    this.amount = amount;
    this.sequence = sequence;
    this.locale = locale;
    this.sendAt = sendAt;
    this.unit = unit;
    this.attributes = attributes;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.ceiling - this.amount) * 100) / 100;
  }

  copy(): CreativeTier {
    return new CreativeTier(
      this.code,
      this.name,
      this.retries,
      this.archived,
      this.amount,
      this.sequence,
      this.locale,
      this.sendAt,
      this.unit,
      this.attributes,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative tier in status new. */
export function newCreativeTier(code: string, name: string): CreativeTier {
  return new CreativeTier(code, name, 0, false, 0, 0, "", 0, "", new Map<string, string>(), 0, "new");
}
