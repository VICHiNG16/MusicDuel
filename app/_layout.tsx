import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, Platform, ToastAndroid } from 'react-native';
import { Colors } from '../constants/Colors';
import { useFonts, Outfit_700Bold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';

export default function Layout() {
    const [fontsLoaded] = useFonts({
        Outfit_700Bold,
        Outfit_900Black,
        Inter_400Regular,
        Inter_600SemiBold,
    });

    const [user, setUser] = useState<any>(null);
    const [authError, setAuthError] = useState<string>('');

    useEffect(() => {
        // Anonymous Sign In
        signInAnonymously(auth)
            .then((userCredential) => {
                console.log("Signed in anonymously:", userCredential.user.uid);
                setUser(userCredential.user);
            })
            .catch((error) => {
                console.error("Auth Error:", error);
                setAuthError(error.message);
            });
    }, []);

    if (authError) {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: Colors.error, textAlign: 'center', fontSize: 16 }}>Authentication Failed</Text>
                <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 10 }}>{authError}</Text>
            </View>
        );
    }

    if (!fontsLoaded || !user) {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={{ color: Colors.textSecondary, marginTop: 20 }}>Signing in...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar style="light" />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background }
            }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="lobby/[id]" />
                <Stack.Screen name="game/[id]" />
            </Stack>
        </View>
    );
}
