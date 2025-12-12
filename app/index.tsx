import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GlassButton } from '../components/GlassButton';
import { Colors } from '../constants/Colors';
import { searchArtists } from '../utils/itunes';
import { Ionicons } from '@expo/vector-icons';
import { SettingsModal } from '../components/SettingsModal';

export default function HomeScreen() {
    const router = useRouter();
    const [gameCode, setGameCode] = useState('');
    const [artistQuery, setArtistQuery] = useState('');
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (artistQuery.length >= 2 && !selectedArtist) {
                setSearching(true);
                const results = await searchArtists(artistQuery);
                setSearchResults(results as any[]);
                setSearching(false);
            } else if (artistQuery.length === 0) {
                setSearchResults([]);
                setSelectedArtist(null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [artistQuery, selectedArtist]);

    const selectArtist = (name: string) => {
        setSelectedArtist(name);
        setArtistQuery(name);
        setSearchResults([]);
    };

    const createRoom = () => {
        if (!selectedArtist) return;
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        router.push(`/lobby/${roomId}?isHost=true&artist=${encodeURIComponent(selectedArtist)}`);
    };

    const createSoloRoom = () => {
        if (!selectedArtist) return;
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        router.push(`/lobby/${roomId}?isHost=true&mode=solo&artist=${encodeURIComponent(selectedArtist)}`);
    };

    const joinRoom = () => {
        if (gameCode.length > 0) {
            router.push(`/lobby/${gameCode}?isHost=false`);
        }
    };

    return (
        <View style={styles.container}>
            <BackgroundGradient />
            <SafeAreaView style={styles.content}>
                <Pressable
                    onPress={() => setSettingsVisible(true)}
                    style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}
                >
                    <Ionicons name="settings-outline" size={28} color={Colors.textSecondary} />
                </Pressable>

                <SettingsModal
                    visible={settingsVisible}
                    onClose={() => setSettingsVisible(false)}
                />

                <Text style={styles.title}>MUSI</Text>
                <Text style={styles.subtitle}>GUESS</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>HOST GAME</Text>
                    <View>
                        <TextInput
                            style={[styles.input, selectedArtist ? { borderColor: Colors.primary, color: Colors.primary } : {}]}
                            placeholder="Search Artist"
                            placeholderTextColor={Colors.textSecondary}
                            value={artistQuery}
                            onChangeText={(t) => {
                                setArtistQuery(t);
                                setSelectedArtist(null);
                            }}
                        />
                        {searching && <ActivityIndicator style={{ position: 'absolute', right: 15, top: 15 }} color={Colors.primary} />}
                    </View>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && !selectedArtist && (
                        <View style={styles.dropdown}>
                            {searchResults.map((item) => (
                                <Pressable
                                    key={item.artistId}
                                    style={styles.dropdownItem}
                                    onPress={() => selectArtist(item.artistName)}
                                >
                                    {item.image && (
                                        <Image source={{ uri: item.image }} style={styles.artistImage} />
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.dropdownTitle}>{item.artistName}</Text>
                                        <Text style={styles.dropdownSubtitle}>{item.primaryGenreName}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {selectedArtist && (
                        <View style={{ gap: 10 }}>
                            <GlassButton title="Create Room" onPress={createRoom} />
                            <GlassButton title="Play Solo" onPress={createSoloRoom} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                    <Text style={styles.label}>JOIN GAME</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Game Code"
                        placeholderTextColor={Colors.textSecondary}
                        value={gameCode}
                        onChangeText={(t) => setGameCode(t.toUpperCase())}
                        maxLength={6}
                    />
                    <GlassButton title="Join Room" onPress={joinRoom} />
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 72,
        fontFamily: 'Outfit_900Black',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 0,
        letterSpacing: 8,
        textShadowColor: Colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 30,
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.text,
        textAlign: 'center',
        letterSpacing: 12,
        marginBottom: 48,
        opacity: 0.8,
    },
    section: {
        gap: 16,
        marginBottom: 24,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 4,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        fontFamily: 'System', // Normalize font
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceHighlight,
        marginVertical: 32,
    },
    dropdown: {
        backgroundColor: '#1a1f35',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginTop: -10,
        marginBottom: 10
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    artistImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceHighlight
    },
    dropdownTitle: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold'
    },
    dropdownSubtitle: {
        color: Colors.textSecondary,
        fontSize: 12
    }
});
