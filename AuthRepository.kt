package com.yourapp.data.repository

import com.yourapp.data.local.TokenManager
import com.yourapp.data.remote.ApiService
import com.yourapp.data.remote.dto.*
import java.security.MessageDigest

class AuthRepository(
    private val apiService: ApiService = com.yourapp.data.remote.RetrofitClient.apiService
) {

    // ---------- LOGIN ----------
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            // ⚠️ Encrypt password before sending
            val encryptedPassword = hashPassword(password)

            val response = apiService.login(
                LoginRequest(email = email, password = encryptedPassword)
            )

            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                // Save JWT token
                TokenManager.saveToken(body.token)
                TokenManager.saveUser(body.user.id, body.user.fullName, body.user.email)
                Result.success(body)
            } else {
                // Parse error message from API
                val errorMsg = when (response.code()) {
                    401 -> "Invalid email or password"
                    400 -> "Bad request. Please check your inputs."
                    else -> "Login failed (${response.code()})"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.localizedMessage ?: "Unknown"}"))
        }
    }

    // ---------- REGISTER ----------
    suspend fun register(fullName: String, email: String, password: String): Result<RegisterResponse> {
        return try {
            val encryptedPassword = hashPassword(password)

            val response = apiService.register(
                RegisterRequest(fullName = fullName, email = email, password = encryptedPassword)
            )

            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                TokenManager.saveToken(body.token)
                TokenManager.saveUser(body.user.id, body.user.fullName, body.user.email)
                Result.success(body)
            } else {
                val errorMsg = when (response.code()) {
                    409 -> "Email already registered"
                    400 -> "Invalid input. Check your details."
                    else -> "Registration failed (${response.code()})"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.localizedMessage ?: "Unknown"}"))
        }
    }

    // ---------- LOGOUT ----------
    suspend fun logout() {
        TokenManager.clear()
    }

    // ---------- PROFILE ----------
    suspend fun getProfile(): Result<UserDto> {
        return try {
            val response = apiService.getProfile()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Could not fetch profile (${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.localizedMessage}"))
        }
    }

    // ---------- PASSWORD HASHING (SHA-256) ----------
    private fun hashPassword(password: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(password.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}