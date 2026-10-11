package com.pennypilot.app.ui.history

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pennypilot.app.data.local.RecentDetectionEntity
import com.pennypilot.app.domain.model.PaymentAppConfig
import com.pennypilot.app.ui.theme.AccentAmber
import com.pennypilot.app.ui.theme.AccentBlue
import com.pennypilot.app.ui.theme.AccentGreen
import com.pennypilot.app.ui.theme.AccentPurple
import com.pennypilot.app.ui.theme.AccentRed
import com.pennypilot.app.ui.theme.DarkSurfaceCard
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecentDetectionsScreen(
    viewModel: RecentDetectionsViewModel,
    onNavigateBack: () -> Unit
) {
    val detections by viewModel.detections.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Recent Detections", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (detections.isNotEmpty()) {
                        IconButton(onClick = { viewModel.clearHistory() }) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Clear History")
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (detections.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(32.dp)
                ) {
                    Icon(
                        Icons.Default.History,
                        contentDescription = null,
                        modifier = Modifier.size(56.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "No transactions detected yet",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Transactions detected from Google Pay, PhonePe, Paytm, or BHIM will show up here.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(detections, key = { it.id }) { item ->
                    DetectionCard(item)
                }
            }
        }
    }
}

@Composable
private fun DetectionCard(item: RecentDetectionEntity) {
    val appConfig = PaymentAppConfig.findByPackage(item.sourceApp)
    val appName = appConfig?.displayName ?: item.sourceApp.split(".").lastOrNull() ?: item.sourceApp
    val formattedDate = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault()).format(Date(item.timestamp))

    Card(
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.merchant ?: "Unknown Counterparty",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "$appName • $formattedDate",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = if (item.amount > 0) "₹${"%.2f".format(item.amount)}" else "₹--",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (item.type == "income") AccentGreen else MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    StatusChip(status = item.status)
                }
            }

            if (!item.externalReference.isNullOrBlank() || !item.details.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                val extraText = when {
                    !item.externalReference.isNullOrBlank() && !item.details.isNullOrBlank() ->
                        "Ref: ${item.externalReference} • ${item.details}"
                    !item.externalReference.isNullOrBlank() -> "Ref: ${item.externalReference}"
                    else -> item.details ?: ""
                }
                Text(
                    text = extraText,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val (label, bg, fg) = when (status.lowercase()) {
        "synced" -> Triple("Synced", AccentGreen.copy(alpha = 0.15f), AccentGreen)
        "pending_review" -> Triple("Needs Review", AccentAmber.copy(alpha = 0.15f), AccentAmber)
        "duplicate" -> Triple("Duplicate", AccentBlue.copy(alpha = 0.15f), AccentBlue)
        "retrying" -> Triple("Retrying", AccentPurple.copy(alpha = 0.15f), AccentPurple)
        "failed" -> Triple("Failed", AccentRed.copy(alpha = 0.15f), AccentRed)
        "parse_failed" -> Triple("Parse Failed", Color.Gray.copy(alpha = 0.15f), Color.LightGray)
        else -> Triple(status.replaceFirstChar { it.uppercase() }, Color.DarkGray, Color.White)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bg)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = label,
            color = fg,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
