import * as text from "../../../../kit/text.js";

/** Where a creative request is in its life cycle. */
export type CreativeRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A creative request. Its code is unique within a tenant. */
export class CreativeRequest {
  code: string;
  name: string;
  locale: string;
  pinned: boolean;
  discount: number;
  status: CreativeRequestStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    pinned: boolean,
    discount: number,
    status: CreativeRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.pinned = pinned;
    this.discount = discount;
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

  canMoveTo(next: CreativeRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): CreativeRequest {
    return new CreativeRequest(this.code, this.name, this.locale, this.pinned, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative request in status proposed. */
export function newCreativeRequest(code: string, name: string): CreativeRequest {
  return new CreativeRequest(code, name, "", false, 0, "proposed");
}
