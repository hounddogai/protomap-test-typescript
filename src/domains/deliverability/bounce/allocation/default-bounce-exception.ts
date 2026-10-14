import * as text from "../../../../kit/text.js";

/** Where a default bounce exception is in its life cycle. */
export type DefaultBounceExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default bounce exception and its current status. */
export class DefaultBounceException {
  code: string;
  title: string;
  archived: boolean;
  variant: string;
  conversionRate: number;
  utmSource: string;
  currency: string;
  phone: string;
  description: string;
  status: DefaultBounceExceptionStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    variant: string,
    conversionRate: number,
    utmSource: string,
    currency: string,
    phone: string,
    description: string,
    status: DefaultBounceExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.variant = variant;
    this.conversionRate = conversionRate;
    this.utmSource = utmSource;
    this.currency = currency;
    this.phone = phone;
    this.description = description;
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

  canMoveTo(next: DefaultBounceExceptionStatus): boolean {
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
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultBounceExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default bounce exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default bounce exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): DefaultBounceException {
    return new DefaultBounceException(
      this.code,
      this.title,
      this.archived,
      this.variant,
      this.conversionRate,
      this.utmSource,
      this.currency,
      this.phone,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default bounce exception in status proposed. */
export function newDefaultBounceException(code: string, title: string): DefaultBounceException {
  return new DefaultBounceException(code, title, false, "", 0, "", "", "", "", "proposed");
}
