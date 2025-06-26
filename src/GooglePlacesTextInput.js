import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  input: {
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  suggestionsContainer: {
    backgroundColor: '#efeff1', // default background
    borderRadius: 6,
    marginTop: 3,
    overflow: 'hidden',
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c8c7cc',
  },
  mainText: {
    fontSize: 16,
    textAlign: 'left',
    color: '#000000',
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'left',
  },
  leftAligned: {
    left: 15,
  },
  rightAligned: {
    right: 15,
  },
});

// Agrego utilitario para generar UUID v4 sin dependencias externas
const generateSessionToken = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const GooglePlacesTextInput = forwardRef(
  (
    {
      apiKey,
      value,
      placeHolderText,
      languageCode,
      includedRegionCodes,
      types = [],
      biasPrefixText,
      minCharsToFetch = 1,
      onPlaceSelect,
      debounceDelay = 200,
      showLoadingIndicator = true,
      fetchPlaceDetails = false,
      placeDetailsFields = ['location'],
      sessionEnabled = true,
      style = {},
    },
    ref
  ) => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputText, setInputText] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimeout = useRef(null);
    const inputRef = useRef(null);
    const sessionTokenRef = useRef(sessionEnabled ? generateSessionToken() : null);

    useEffect(() => {
      return () => {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, []);

    // Add keyboard listener
    useEffect(() => {
      const keyboardDidHideSubscription = Keyboard.addListener(
        'keyboardDidHide',
        () => setShowSuggestions(false)
      );

      return () => {
        keyboardDidHideSubscription.remove();
      };
    }, []);

    // Expose methods to parent through ref
    useImperativeHandle(ref, () => ({
      clear: () => {
        setInputText('');
        setPredictions([]);
        setShowSuggestions(false);
      },
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const fetchPredictions = async (text) => {
      if (!text || text.length < minCharsToFetch) {
        setPredictions([]);
        return;
      }

      const processedText = biasPrefixText ? biasPrefixText(text) : text;

      try {
        setLoading(true);
        const response = await fetch(
          'https://places.googleapis.com/v1/places:autocomplete',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
            },
            body: JSON.stringify({
              input: processedText,
              languageCode,
              ...(includedRegionCodes?.length > 0 && { includedRegionCodes }),
              ...(types.length > 0 && { includedPrimaryTypes: types }),
              ...(sessionEnabled && { sessionToken: sessionTokenRef.current }),
            }),
          }
        );

        const data = await response.json();

        if (data.suggestions) {
          setPredictions(data.suggestions);
          setShowSuggestions(true);
        } else {
          setPredictions([]);
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    // Nueva función para obtener detalles de lugar (lat/lng)
    const retrievePlaceDetails = async (placeId) => {
      try {
        setLoading(true);
        const fieldsParam = Array.isArray(placeDetailsFields)
          ? placeDetailsFields.join(',')
          : placeDetailsFields;
        const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${fieldsParam}${
          languageCode ? `&languageCode=${languageCode}` : ''
        }${sessionEnabled ? `&sessionToken=${sessionTokenRef.current}` : ''}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
        });
        return await response.json();
      } catch (err) {
        console.error('Error fetching place details:', err);
        return null;
      } finally {
        setLoading(false);
      }
    };

    const handleTextChange = (text) => {
      setInputText(text);
      onPlaceSelect(null); // Notify parent when text changes

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        fetchPredictions(text);
      }, debounceDelay);
    };

    const handleSuggestionPress = async (suggestion) => {
      const place = suggestion.placePrediction;
      setInputText(place.structuredFormat.mainText.text);
      setShowSuggestions(false);
      Keyboard.dismiss();

      if (fetchPlaceDetails) {
        const details = await retrievePlaceDetails(place.placeId);
        // Mezclamos la información básica con los detalles
        const combinedPlace = { ...place, details };
        onPlaceSelect(combinedPlace);
      } else {
        onPlaceSelect(place);
      }

      // La llamada a Place Details termina la sesión; generamos un nuevo token
      if (sessionEnabled) {
        sessionTokenRef.current = generateSessionToken();
      }
    };

    // Si comenzamos una nueva búsqueda generamos token nuevo
    const handleFocus = () => {
      if (sessionEnabled && inputText.length === 0) {
        sessionTokenRef.current = generateSessionToken();
      }
      if (inputText.length >= minCharsToFetch) {
        fetchPredictions(inputText);
        setShowSuggestions(true);
      }
    };

    // Update text alignment based on language
    const isRTL =
      languageCode?.startsWith('he') || languageCode?.startsWith('ar');

    const renderSuggestion = ({ item }) => {
      const { mainText, secondaryText } = item.placePrediction.structuredFormat;

      return (
        <TouchableOpacity
          style={[
            styles.suggestionItem,
            // Inherit background color from container if not specified
            {
              backgroundColor:
                style.suggestionsContainer?.backgroundColor || '#efeff1',
            },
            style.suggestionItem,
          ]}
          onPress={() => handleSuggestionPress(item)}
        >
          <Text
            style={[
              styles.mainText,
              style.suggestionText?.main,
              isRTL && styles.rtlText,
            ]}
          >
            {mainText.text}
          </Text>
          {secondaryText && (
            <Text
              style={[
                styles.secondaryText,
                style.suggestionText?.secondary,
                isRTL && styles.rtlText,
              ]}
            >
              {secondaryText.text}
            </Text>
          )}
        </TouchableOpacity>
      );
    };

    const renderSuggestions = () => {
      if (!showSuggestions || predictions.length === 0) return null;

      return (
        <View style={[styles.suggestionsContainer, style.suggestionsContainer]}>
          <FlatList
            data={predictions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.placePrediction.placeId}
            keyboardShouldPersistTaps="always"
            style={style.suggestionsList}
            scrollEnabled={true}
            bounces={false}
            nestedScrollEnabled={true}
          />
        </View>
      );
    };

    return (
      <View style={[styles.container, style.container]}>
        <View>
          <TextInput
            ref={inputRef}
            style={[styles.input, style.input]}
            placeholder={placeHolderText}
            placeholderTextColor={style.placeholder?.color || '#666666'} // Default color
            value={inputText}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={() => setShowSuggestions(false)}
            textAlign={isRTL ? 'right' : 'left'}
          />
          {loading && showLoadingIndicator && (
            <ActivityIndicator
              style={[
                styles.loadingIndicator,
                isRTL ? styles.leftAligned : styles.rightAligned,
              ]}
              size={'small'}
              color={style.loadingIndicator?.color || '#000000'} // Default color
            />
          )}
        </View>
        {renderSuggestions()}
      </View>
    );
  }
);

export default GooglePlacesTextInput;
