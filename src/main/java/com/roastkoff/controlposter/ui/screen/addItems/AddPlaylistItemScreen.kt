package com.roastkoff.controlposter.ui.screen.addItems

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPlaylistItemScreen(
    playlistId: String,
    onNavigateBack: () -> Unit
) {
    var itemName by remember { mutableStateOf("") }
    var itemType by remember { mutableStateOf("image") }
    var nameError by remember { mutableStateOf(false) }
    var selectedMediaUri by remember { mutableStateOf<Uri?>(null) }

    val mediaPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        selectedMediaUri = uri
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("การเพิ่ม item") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Outlined.Close, "Close")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        "ชื่อitem",
                        style = MaterialTheme.typography.titleMedium
                    )

                    OutlinedTextField(
                        value = itemName,
                        onValueChange = {
                            itemName = it
                            nameError = it.isBlank()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("ใส่ชื่อ item") },
                        isError = nameError,
                        supportingText = if (nameError) {
                            { Text("กรุณาใส่ชื่อ item") }
                        } else null,
                        singleLine = true
                    )
                }
            }

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        "ประเภท",
                        style = MaterialTheme.typography.titleMedium
                    )

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectableGroup(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .selectable(
                                    selected = itemType == "image",
                                    onClick = { itemType = "image" },
                                    role = Role.RadioButton
                                )
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            RadioButton(
                                selected = itemType == "image",
                                onClick = null
                            )
                            Text(
                                "image",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .selectable(
                                    selected = itemType == "video",
                                    onClick = { itemType = "video" },
                                    role = Role.RadioButton
                                )
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            RadioButton(
                                selected = itemType == "video",
                                onClick = null
                            )
                            Text(
                                "video",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                }
            }

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            val mimeType = if (itemType == "image") "image/*" else "video/*"
                            mediaPickerLauncher.launch(mimeType)
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (itemType == "image") "เลือกรูป" else "เลือกวิดีโอ")
                    }

                    selectedMediaUri?.let { uri ->
                        Text(
                            text = uri.lastPathSegment ?: uri.toString(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)
            ) {
                Button(
                    onClick = {
                        if (itemName.isNotBlank()) {

                            onNavigateBack()
                        } else {
                            nameError = itemName.isBlank()
                        }
                    },
                    modifier = Modifier.width(120.dp)
                ) {
                    Text("Add")
                }
            }
        }
    }
}
