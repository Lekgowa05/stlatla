package com.yourapp.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

// Extension for Context
val Context.dataStore by preferencesDataStore(name = "auth_prefs")

object TokenManager {

    private val TOKEN_KEY = stringPreferencesKey("jwt_token")
    private val USER_NAME_KEY = stringPreferencesKey("user_name")
    private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    private val USER_ID_KEY = stringPreferencesKey("user_id")

    private lateinit var appContext: Context

    // Initialize this in MainActivity or Application class
    fun init(context: Context) {
        appContext = context.applicationContext
    }

    // ---------- SAVE ----------
    suspend fun saveToken(token: String) {
        appContext.dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
        }
    }

    suspend fun saveUser(id: String, fullName: String, email: String) {
        appContext.dataStore.edit { prefs ->
            prefs[USER_ID_KEY] = id
            prefs[USER_NAME_KEY] = fullName
            prefs[USER_EMAIL_KEY] = email
        }
    }

    // ---------- READ ----------
    suspend fun getTokenAsync(): String? {
        return appContext.dataStore.data.first()[TOKEN_KEY]
    }

    // Blocking read — used only by the OkHttp interceptor
    fun getToken(): String? = runBlocking {
        try {
            appContext.dataStore.data.first()[TOKEN_KEY]
        } catch (e: Exception) {
            null
        }
    }

    suspend fun getUserName(): String? = appContext.dataStore.data.first()[USER_NAME_KEY]
    suspend fun getUserEmail(): String? = appContext.dataStore.data.first()[USER_EMAIL_KEY]
    suspend fun getUserId(): String? = appContext.dataStore.data.first()[USER_ID_KEY]

    // ---------- CLEAR (Logout) ----------
    suspend fun clear() {
        appContext.dataStore.edit { it.clear() }
    }

    fun isLoggedIn(): Boolean = getToken() != null
}