package com.pennypilot.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.pennypilot.app.ui.history.RecentDetectionsScreen
import com.pennypilot.app.ui.history.RecentDetectionsViewModel
import com.pennypilot.app.ui.home.HomeScreen
import com.pennypilot.app.ui.home.HomeViewModel
import com.pennypilot.app.ui.settings.SettingsScreen
import com.pennypilot.app.ui.settings.SettingsViewModel
import com.pennypilot.app.ui.simulator.NotificationSimulatorScreen
import com.pennypilot.app.ui.simulator.NotificationSimulatorViewModel
import com.pennypilot.app.ui.theme.PennyPilotTheme

class MainActivity : ComponentActivity() {

    private val homeViewModel: HomeViewModel by viewModels()
    private val settingsViewModel: SettingsViewModel by viewModels()
    private val historyViewModel: RecentDetectionsViewModel by viewModels()
    private val simulatorViewModel: NotificationSimulatorViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PennyPilotTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PennyPilotNavigation(
                        homeViewModel = homeViewModel,
                        settingsViewModel = settingsViewModel,
                        historyViewModel = historyViewModel,
                        simulatorViewModel = simulatorViewModel
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        homeViewModel.refreshStatus()
    }
}

@Composable
fun PennyPilotNavigation(
    homeViewModel: HomeViewModel,
    settingsViewModel: SettingsViewModel,
    historyViewModel: RecentDetectionsViewModel,
    simulatorViewModel: NotificationSimulatorViewModel
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(
                viewModel = homeViewModel,
                onNavigateToSettings = { navController.navigate("settings") },
                onNavigateToHistory = { navController.navigate("history") },
                onNavigateToSimulator = { navController.navigate("simulator") }
            )
        }

        composable("settings") {
            SettingsScreen(
                viewModel = settingsViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("history") {
            RecentDetectionsScreen(
                viewModel = historyViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("simulator") {
            NotificationSimulatorScreen(
                viewModel = simulatorViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
