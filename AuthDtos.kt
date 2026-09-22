package com.yourapp.data.remote.dto

import com.google.gson.annotations.SerializedName

// ---------- LOGIN ----------
data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("token") val token: String,
    @SerializedName("user") val user: UserDto
)

// ---------- REGISTER ----------
data class RegisterRequest(
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class RegisterResponse(
    @SerializedName("token") val token: String,
    @SerializedName("user") val user: UserDto
)

// ---------- USER ----------
data class UserDto(
    @SerializedName("_id") val id: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("jobsPosted") val jobsPosted: Int = 0,
    @SerializedName("rating") val rating: Double = 0.0,
    @SerializedName("reviews") val reviews: Int = 0
)