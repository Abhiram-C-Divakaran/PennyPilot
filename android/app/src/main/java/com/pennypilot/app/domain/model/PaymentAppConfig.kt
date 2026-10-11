package com.pennypilot.app.domain.model

data class PaymentAppConfig(
    val packageName: String,
    val displayName: String,
    val defaultPaymentMethod: PaymentMethod = PaymentMethod.UPI,
    val enabledByDefault: Boolean = true
) {
    companion object {
        val SUPPORTED_APPS = listOf(
            PaymentAppConfig(
                packageName = "com.google.android.apps.nbu.paisa.user",
                displayName = "Google Pay",
                defaultPaymentMethod = PaymentMethod.UPI
            ),
            PaymentAppConfig(
                packageName = "com.phonepe.app",
                displayName = "PhonePe",
                defaultPaymentMethod = PaymentMethod.UPI
            ),
            PaymentAppConfig(
                packageName = "net.one97.paytm",
                displayName = "Paytm",
                defaultPaymentMethod = PaymentMethod.UPI
            ),
            PaymentAppConfig(
                packageName = "in.org.npci.upiapp",
                displayName = "BHIM",
                defaultPaymentMethod = PaymentMethod.UPI
            ),
            PaymentAppConfig(
                packageName = "com.dreamplug.androidapp",
                displayName = "CRED",
                defaultPaymentMethod = PaymentMethod.CREDIT_CARD
            ),
            PaymentAppConfig(
                packageName = "in.amazon.mShop.android.shopping",
                displayName = "Amazon Pay",
                defaultPaymentMethod = PaymentMethod.UPI
            )
        )

        fun findByPackage(packageName: String): PaymentAppConfig? {
            return SUPPORTED_APPS.find { it.packageName == packageName }
        }
    }
}
