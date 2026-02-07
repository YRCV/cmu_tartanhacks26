import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView } from 'react-native';
import axios from 'axios';

export default function HomeScreen() {
  const [espIp, setEspIp] = useState(process.env.EXPO_PUBLIC_ESP_IP || '');
  const [ledStatus, setLedStatus] = useState('Unknown');
  const [loading, setLoading] = useState(false);

  const sendCommand = async (command: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://${espIp}/led/${command}`, {
        timeout: 3000
      });
      setLedStatus(response.data);
      Alert.alert('Success', typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to connect to ESP32');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://${espIp}/`, {
        timeout: 3000
      });
      setLedStatus(response.data);
      Alert.alert('Status', typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to connect to ESP32');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ESP32 Controller</Text>

      <View style={styles.section}>
        <Text>IP Address:</Text>
        <TextInput
          style={styles.input}
          value={espIp}
          onChangeText={setEspIp}
          placeholder="192.168.1.150"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.status}>Status: {ledStatus}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Connecting..." : "Toggle LED"}
          onPress={() => sendCommand('toggle')}
          disabled={loading}
        />
        <View style={styles.spacer} />
        <Button
          title="LED ON"
          onPress={() => sendCommand('on')}
          disabled={loading}
        />
        <View style={styles.spacer} />
        <Button
          title="LED OFF"
          onPress={() => sendCommand('off')}
          disabled={loading}
        />
        <View style={styles.spacer} />
        <Button
          title="Get Status"
          onPress={getStatus}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 10,
  },
  spacer: {
    height: 10,
  },
});
