"use client";

import { usePaymentMethods } from "@/hooks/use-trip-queries";
import { useBookingStore } from "@/stores/booking-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCardIcon, PlusIcon, StarIcon } from "lucide-react";
import { cn } from "cn";
import { useRouter } from "next/navigation";

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { data: methods = [] } = usePaymentMethods();
  const setPaymentMethodId = useBookingStore((s) => s.setPaymentMethodId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-safe">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Payment methods</h1>
          <p className="text-sm text-muted-foreground">Cards and wallets you can charge.</p>
        </div>
        <Button>
          <PlusIcon />
          Add
        </Button>
      </header>

      <div className="space-y-2">
        {methods.map((pm) => (
          <Card key={pm.id} size="sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-12 place-items-center rounded-md bg-secondary text-sm font-semibold uppercase">
                {pm.brand.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {pm.brand.toUpperCase()} •••• {pm.last4}
                </div>
                <div className="text-xs text-muted-foreground">
                  Exp {pm.expMonth.toString().padStart(2, "0")}/{pm.expYear}
                </div>
              </div>
              {pm.isDefault && (
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                  <StarIcon className="size-3 fill-status-searching text-status-searching" />
                  Default
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Payments are processed securely via Stripe. Card data is tokenized and never stored on our servers.
      </p>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CreditCardIcon className="size-3.5" />
        <span>PCI-DSS compliant</span>
      </div>
    </div>
  );
}
