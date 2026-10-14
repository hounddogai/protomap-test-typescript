import * as text from "../../../../kit/text.js";

/** Where a reply proposal is in its life cycle. */
export type ReplyProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One reply proposal, with what the planners need to act on it. */
export class ReplyProposal {
  code: string;
  name: string;
  score: number;
  visible: boolean;
  floorValue: number;
  discount: number;
  description: string;
  quantity: number;
  locale: string;
  weight: number;
  graceDays: number;
  status: ReplyProposalStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    visible: boolean,
    floorValue: number,
    discount: number,
    description: string,
    quantity: number,
    locale: string,
    weight: number,
    graceDays: number,
    status: ReplyProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.visible = visible;
    this.floorValue = floorValue;
    this.discount = discount;
    this.description = description;
    this.quantity = quantity;
    this.locale = locale;
    this.weight = weight;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.discount + this.quantity) * 100) / 100;
  }

  copy(): ReplyProposal {
    return new ReplyProposal(
      this.code,
      this.name,
      this.score,
      this.visible,
      this.floorValue,
      this.discount,
      this.description,
      this.quantity,
      this.locale,
      this.weight,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reply proposal in status draft. */
export function newReplyProposal(code: string, name: string): ReplyProposal {
  return new ReplyProposal(code, name, 0, false, 0, 0, "", 0, "", 0, 0, "draft");
}
