import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type Props = {
  title: string;
  description: string;
};

// Stand-in for each tab until its real screen is built.
export default function ScreenPlaceholder({ title, description }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.card}>
          <Text style={styles.body}>{description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 34, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16 },
  body: { color: colors.textSecondary, fontSize: 17, lineHeight: 24 },
});
