package com.yourapp.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yourapp.ui.theme.NewDawnDarkText
import com.yourapp.ui.theme.NewDawnGreen
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class UserProfile(
    val fullName: String = "",
    val email: String = "",
    val jobsPosted: Int = 0,
    val rating: Double = 0.0,
    val reviews: Int = 0
)

class ProfileViewModel : ViewModel() {
    private val _user = MutableStateFlow<UserProfile?>(null)
    val user: StateFlow<UserProfile?> = _user.asStateFlow()

    init {
        _user.value = UserProfile(
            fullName = "Sarah Lekoane",
            email = "sarah@example.com",
            jobsPosted = 12,
            rating = 4.7,
            reviews = 8
        )
    }
}

@Composable
fun ProfileScreen(
    onLogout: () -> Unit = {},
    viewModel: ProfileViewModel = viewModel()
) {
    val userState by viewModel.user.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        userState?.let { profile ->
            Spacer(modifier = Modifier.height(32.dp))
            Surface(
                modifier = Modifier.size(80.dp),
                shape = CircleShape,
                color = NewDawnGreen
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = profile.fullName.take(1),
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = profile.fullName,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = NewDawnDarkText
            )
            Text(
                text = profile.email,
                fontSize = 14.sp,
                color = Color.Gray
            )
            Spacer(modifier = Modifier.height(24.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "${profile.jobsPosted}", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(text = "Jobs Posted", fontSize = 12.sp, color = Color.Gray)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "${profile.rating}", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(text = "Rating", fontSize = 12.sp, color = Color.Gray)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "${profile.reviews}", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(text = "Reviews", fontSize = 12.sp, color = Color.Gray)
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = NewDawnGreen)
            ) {
                Text("Logout", fontWeight = FontWeight.Bold)
            }
        }
    }
}
