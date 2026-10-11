package com.pennypilot.app.ui.simulator

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pennypilot.app.ui.theme.AccentGreen
import com.pennypilot.app.ui.theme.AccentAmber
import com.pennypilot.app.ui.theme.AccentRed
import com.pennypilot.app.ui.theme.DarkSurfaceCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSimulatorScreen(
    viewModel: NotificationSimulatorViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notification Simulator", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(modifier = Modifier.height(2.dp))

            Text(
                "Presets",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                FilterChip(
                    selected = state.textInput.contains("ZOMATO"),
                    onClick = {
                        viewModel.setSample(
                            pkg = "com.google.android.apps.nbu.paisa.user",
                            title = "Payment successful",
                            text = "Paid ₹450 to ZOMATO via UPI ref 10928374"
                        )
                    },
                    label = { Text("Google Pay") }
                )
                FilterChip(
                    selected = state.textInput.contains("Uber"),
                    onClick = {
                        viewModel.setSample(
                            pkg = "com.phonepe.app",
                            title = "Payment Successful",
                            text = "₹320 paid to Uber India. Transferred from A/c XX4589 UTR: 99182312"
                        )
                    },
                    label = { Text("PhonePe") }
                )
                FilterChip(
                    selected = state.textInput.contains("Blinkit"),
                    onClick = {
                        viewModel.setSample(
                            pkg = "net.one97.paytm",
                            title = "Money Sent",
                            text = "Paid ₹1,250.50 to Blinkit using Paytm Wallet Txn ID 8829102"
                        )
                    },
                    label = { Text("Paytm") }
                )
            }

            // Input Fields
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = state.selectedPackage,
                        onValueChange = { viewModel.updatePackage(it) },
                        label = { Text("Package ID") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = state.titleInput,
                        onValueChange = { viewModel.updateTitle(it) },
                        label = { Text("Notification Title") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = state.textInput,
                        onValueChange = { viewModel.updateText(it) },
                        label = { Text("Notification Text") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                }
            }

            // Parsed Result Card
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Parsed Result",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    if (state.parsedResult == null) {
                        Text(
                            "Could not parse notification into a financial transaction.",
                            color = AccentAmber,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    } else {
                        val parsed = state.parsedResult!!
                        ResultRow("Parser", state.parserUsed ?: "Unknown")
                        ResultRow("Amount", "₹${"%.2f".format(parsed.amount)}")
                        ResultRow("Type", parsed.type.name)
                        ResultRow("Merchant", parsed.merchant ?: "None")
                        ResultRow("Payment Rail", parsed.paymentMethod?.name ?: "None")
                        ResultRow("Reference ID", parsed.externalReference ?: "None")
                        ResultRow("Account", parsed.sourceAccount ?: "None")
                        ResultRow("Confidence", "${(parsed.parserConfidence * 100).toInt()}%")

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = { viewModel.sendToBackend() },
                            enabled = !state.isSending,
                            colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (state.isSending) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.Black)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Sending to Backend...", color = Color.Black)
                            } else {
                                Icon(Icons.Default.Send, contentDescription = null, tint = Color.Black)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Send to PennyPilot Ingestion API", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (state.sendStatus != null) {
                            Spacer(modifier = Modifier.height(10.dp))
                            val isOk = state.sendStatus!!.startsWith("✓")
                            Text(
                                text = state.sendStatus!!,
                                color = if (isOk) AccentGreen else AccentRed,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun ResultRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}
