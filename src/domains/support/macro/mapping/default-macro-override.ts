import * as text from "../../../../kit/text.js";

/** Where a default macro override is in its life cycle. */
export type DefaultMacroOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a default macro override and its current status. */
export class DefaultMacroOverride {
  code: string;
  title: string;
  phone: string;
  discount: number;
  contactEmail: string;
  ratio: number;
  category: string;
  status: DefaultMacroOverrideStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    discount: number,
    contactEmail: string,
    ratio: number,
    category: string,
    status: DefaultMacroOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultMacroOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultMacroOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default macro override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.discount - this.ratio) * 100) / 100;
  }

  copy(): DefaultMacroOverride {
    return new DefaultMacroOverride(
      this.code,
      this.title,
      this.phone,
      this.discount,
      this.contactEmail,
      this.ratio,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a default macro override in status open. */
export function newDefaultMacroOverride(code: string, title: string): DefaultMacroOverride {
  return new DefaultMacroOverride(code, title, "", 0, "", 0, "", "open");
}
