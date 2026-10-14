import * as text from "../../../../kit/text.js";

/** Where a default placement digest is in its life cycle. */
export type DefaultPlacementDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default placement digest. Its code is unique within a tenant. */
export class DefaultPlacementDigest {
  code: string;
  name: string;
  contactEmail: string;
  description: string;
  variant: string;
  discount: number;
  status: DefaultPlacementDigestStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    description: string,
    variant: string,
    discount: number,
    status: DefaultPlacementDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.description = description;
    this.variant = variant;
    this.discount = discount;
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

  canMoveTo(next: DefaultPlacementDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultPlacementDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default placement digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default placement digest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): DefaultPlacementDigest {
    return new DefaultPlacementDigest(
      this.code,
      this.name,
      this.contactEmail,
      this.description,
      this.variant,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default placement digest in status draft. */
export function newDefaultPlacementDigest(code: string, name: string): DefaultPlacementDigest {
  return new DefaultPlacementDigest(code, name, "", "", "", 0, "draft");
}
