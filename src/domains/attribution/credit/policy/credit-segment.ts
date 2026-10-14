import * as text from "../../../../kit/text.js";

/** Where a credit segment is in its life cycle. */
export type CreditSegmentStatus = "created" | "validated" | "published" | "retired";

/** A credit segment as the credit team keeps it. */
export class CreditSegment {
  code: string;
  title: string;
  audienceId: string;
  attributes: Map<string, string>;
  amount: number;
  contactEmail: string;
  tags: string[];
  locale: string;
  description: string;
  name: string;
  status: CreditSegmentStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    attributes: Map<string, string>,
    amount: number,
    contactEmail: string,
    tags: string[],
    locale: string,
    description: string,
    name: string,
    status: CreditSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.attributes = attributes;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.tags = tags;
    this.locale = locale;
    this.description = description;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CreditSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): CreditSegment {
    return new CreditSegment(
      this.code,
      this.title,
      this.audienceId,
      this.attributes,
      this.amount,
      this.contactEmail,
      this.tags,
      this.locale,
      this.description,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit segment in status created. */
export function newCreditSegment(code: string, title: string): CreditSegment {
  return new CreditSegment(code, title, "", new Map<string, string>(), 0, "", [], "", "", "", "created");
}
