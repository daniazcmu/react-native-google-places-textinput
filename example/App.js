import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import GooglePlacesTextInput from 'react-native-google-places-textinput';

const App = () => {
  const handleBasicPlaceSelect = (place) => {
    console.log('Basic example selected place:', place);
  };

  const handleStyledPlaceSelect = (place) => {
    console.log('Styled example selected place:', place);
  };

  // Custom styles example
  const customStyles = {
    container: {
      width: '100%',
      paddingHorizontal: 16,
    },
    input: {
      height: 50,
      borderWidth: 1.5,
      borderColor: '#E0E0E0',
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      backgroundColor: '#F8F8F8',
    },
    suggestionsContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      marginTop: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    suggestionItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    suggestionText: {
      main: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
      },
      secondary: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
      },
    },
    loadingIndicator: {
      color: '#666666',
    },
    placeholder: {
      color: '#999999',
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Example</Text>
        <GooglePlacesTextInput
          apiKey="YOUR_API_KEY_HERE"
          placeHolderText="Search for a location"
          onPlaceSelect={handleBasicPlaceSelect}
          minCharsToFetch={3}
          debounceDelay={350}
          languageCode="en"
          fetchPlaceDetails={true}
          placeDetailsFields={["location", "formattedAddress"]}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Styled Example</Text>
        <GooglePlacesTextInput
          apiKey="YOUR_API_KEY_HERE"
          placeHolderText="Find places nearby"
          onPlaceSelect={handleStyledPlaceSelect}
          style={customStyles}
          minCharsToFetch={3}
          debounceDelay={350}
          languageCode="en"
          types={['restaurant', 'cafe']}
          fetchPlaceDetails={true}
          placeDetailsFields={["location", "formattedAddress"]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 16,
    color: '#333333',
  },
});

export default App;
