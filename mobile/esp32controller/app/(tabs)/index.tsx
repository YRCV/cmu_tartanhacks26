
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import axios from 'axios';

export default function HomeScreen() {
  const [prompt, setPrompt] = useState('Blink the LED fast');
  const [espIp, setEspIp] = useState('esp32-tartanhacks.local');
  const [backendIp, setBackendIp] = useState('10.208.4.179');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!prompt) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setLoading(true);
    setStatus('Generating & Deploying...');

    try {
      const backendUrl = `http://${backendIp}:8001/generate`;
      console.log(`Calling backend at: ${backendUrl}`);

      const response = await axios.post(backendUrl, {
        prompt: prompt,
        esp_ip: espIp
      }, { timeout: 300000 }); // Increase timeout to 5 minutes for AI + Compilation

      if (response.data.status === 'success') {
        setStatus('Success! OTA Triggered.');
        Alert.alert('Success', 'Firmware generated and OTA triggered!');
      } else {
        setStatus('Error: ' + response.data.message);
        Alert.alert('Error', response.data.message);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || error.message;
      setStatus('Failed: ' + msg);
      Alert.alert('Error', 'Failed to generate firmware: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ESP32 Controller</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Backend IP (PC):</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.x"
          value={backendIp}
          onChangeText={setBackendIp}
        />
        <Text style={styles.label}>ESP32 IP/Hostname:</Text>
        <TextInput
          style={styles.input}
          placeholder="esp32-tartanhacks.local"
          value={espIp}
          onChangeText={setEspIp}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Firmware Prompt:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. 'Blink the LED every 100ms'"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Generate & Deploy" onPress={handleGenerate} disabled={loading} />
        {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 10 }} />}
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
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
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 10,
  },
  status: {
    marginTop: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  }
});
