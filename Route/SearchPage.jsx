import { MainWrapper } from "../Layout/MainWrapper";
import { SearchBar } from "../Component/Global/SearchBar";
import Tabs from "../Component/Global/Tabs/Tabs";
import { useEffect, useState } from "react";
import { getSearchSongData, getSearchArtistData } from "../Api/Songs";
import { View, TouchableOpacity, ToastAndroid, TextInput, Pressable, Dimensions } from "react-native";
import SongDisplay from "../Component/SearchPage/SongDisplay";
import { LoadingComponent } from "../Component/Global/Loading";
import { getSearchPlaylistData } from "../Api/Playlist";
import PlaylistDisplay from "../Component/SearchPage/PlaylistDisplay";
import { getSearchAlbumData } from "../Api/Album";
import AlbumsDisplay from "../Component/SearchPage/AlbumDisplay";
import ArtistDisplay from "../Component/SearchPage/ArtistDisplay";
import { Spacer } from "../Component/Global/Spacer";
import { getTidalSearchSongData } from "../Api/TidalAPI";
import { GetTidalEnabled } from "../LocalStorage/AppSettings";
import { PlainText } from "../Component/Global/PlainText";
import { useTheme } from "@react-navigation/native";
import Entypo from "react-native-vector-icons/Entypo";

export const SearchPage = ({navigation}) => {
  const { colors } = useTheme();
  const width = Dimensions.get("window").width;
  const [ActiveTab, setActiveTab] = useState(0)
  const [query, setQuery] = useState("");
  // const [ApiQuery, setApiQuery] = useState("");
  const [SearchText, setSearchText] = useState("")
  const [Loading, setLoading] = useState(false)
  const [Data, setData] = useState({});
  const [tidalEnabled, setTidalEnabled] = useState(false);
  const [selectedSource, setSelectedSource] = useState('saavn'); // 'saavn' or 'tidal'
  const [manualSearch, setManualSearch] = useState(false); // For manual search trigger
  const limit = 20
  async function fetchSearchData(text){
    if (SearchText !== ""){
      // For Tidal, require minimum 3 characters to avoid rate limiting
      if (selectedSource === 'tidal' && tidalEnabled && text.trim().length < 3) {
        console.log('Tidal search requires at least 3 characters');
        setData({ data: { results: [] } });
        return;
      }

      try {
        setLoading(true)
        let data
        if (ActiveTab === 0){
          // Songs tab - check source with lazy loading for Tidal
          if (selectedSource === 'tidal' && tidalEnabled) {
            data = await getTidalSearchSongData(text) // Fetch all results, no limit needed
          } else {
            data = await getSearchSongData(text, 1, limit)
          }
        } else if (ActiveTab === 1){
          // Playlists - only Saavn supported
          if (selectedSource === 'tidal' && tidalEnabled) {
            ToastAndroid.show('Playlists are not supported with Tidal. Showing Saavn results.', ToastAndroid.LONG);
          }
          data = await getSearchPlaylistData(text,1,limit)
        }
        else if (ActiveTab === 2){
          // Albums - only Saavn supported
          if (selectedSource === 'tidal' && tidalEnabled) {
            ToastAndroid.show('Albums are not supported with Tidal. Showing Saavn results.', ToastAndroid.LONG);
          }
          data = await getSearchAlbumData(text,1,limit)
        }
        else if (ActiveTab === 3){
          // Artists - only Saavn supported
          if (selectedSource === 'tidal' && tidalEnabled) {
            ToastAndroid.show('Artists are not supported with Tidal. Showing Saavn results.', ToastAndroid.LONG);
          }
          data = await getSearchArtistData(text,1,limit)
        }
        // Check if data is valid before setting
        if (data && (data.success !== false)) {
          setData(data)
        } else {
          // Enhanced error handling for Tidal
          if (selectedSource === 'tidal') {
            const errorType = data?.error;
            switch (errorType) {
              case 'RATE_LIMITED':
                ToastAndroid.show('Tidal rate limit reached. Please wait a moment and try again.', ToastAndroid.LONG);
                break;
              case 'SERVER_ERROR':
                ToastAndroid.show('Tidal server is temporarily unavailable. Please try again later.', ToastAndroid.LONG);
                break;
              case 'TIMEOUT':
                ToastAndroid.show('Tidal search timed out. Please check your connection and try again.', ToastAndroid.LONG);
                break;
              default:
                ToastAndroid.show(data?.message || 'Tidal search failed. Please try again or switch to Saavn.', ToastAndroid.LONG);
            }
          }
          setData({ data: { results: [] } }); // Set empty results
        }
      } catch (e) {
        if (selectedSource === 'tidal') {
          if (e.message?.includes('rate limit') || e.message?.includes('429')) {
            ToastAndroid.show('Tidal rate limit reached. Please wait a moment and try again.', ToastAndroid.LONG);
          } else if (e.message?.includes('timeout')) {
            ToastAndroid.show('Tidal search timed out. Please check your connection and try again.', ToastAndroid.LONG);
          } else {
            ToastAndroid.show('Tidal search failed. Please check your internet connection.', ToastAndroid.LONG);
          }
        }
        console.log(e);
        setData({ data: { results: [] } }); // Set empty results on error
      } finally {
        setLoading(false)
      }
    } else {
      setData([])
    }
  }
  useEffect(() => {
    if (SearchText){
      // For Tidal, only search if it's a manual search or if using Saavn
      if (selectedSource === 'tidal' && tidalEnabled && !manualSearch) {
        // Don't auto-search for Tidal, wait for manual trigger
        return;
      }
      fetchSearchData(SearchText)
    } else {
      setData([])
    }
  }, [SearchText, manualSearch]);
  useEffect(() => {
    // For Tidal, don't auto-search on typing, only for Saavn
    if (selectedSource === 'tidal' && tidalEnabled) {
      // Don't set SearchText automatically for Tidal
      setManualSearch(false);
      return;
    }

    // Normal debouncing for Saavn
    const timeoutId = setTimeout(()=>{
      setSearchText(query);
      setManualSearch(false);
    }, 350);

    return () => {
      clearTimeout(timeoutId)
    }
  }, [query, selectedSource, tidalEnabled]);

  // Manual search function for Tidal
  const handleManualSearch = () => {
    if (query.trim().length >= 3) {
      setSearchText(query);
      setManualSearch(true);
    } else if (selectedSource === 'tidal') {
      ToastAndroid.show('Please enter at least 3 characters for Tidal search', ToastAndroid.SHORT);
    }
  };
  useEffect(()=>{
      fetchSearchData(SearchText)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ActiveTab, selectedSource])

  // Load Tidal preference on mount
  useEffect(() => {
    const loadTidalPreference = async () => {
      const enabled = await GetTidalEnabled();
      setTidalEnabled(enabled);
    };
    loadTidalPreference();
  }, []);
  return (
    <MainWrapper>
      <Spacer/>

      {/* Custom Search Bar with Tidal support */}
      <View style={{
        flexDirection:"row",
        gap:2,
        alignItems:"center",
        height:60,
        marginHorizontal:10,
      }}>
        <View style={{
          flex:1,
          paddingHorizontal:5,
          backgroundColor:"rgba(0,0,0,0)",
          borderTopLeftRadius:10,
          borderBottomLeftRadius:10
        }}>
          <TextInput
            cursorColor={colors.text}
            placeholder="Search songs"
            style={{
              color: colors.text,
              fontSize:25,
              fontFamily:"roboto",
            }}
            onChangeText={(text) => setQuery(text)}
            onSubmitEditing={handleManualSearch} // Handle Enter key for Tidal
            returnKeyType="search"
            autoFocus={true}
            value={query}
          />
        </View>

        {/* Search button for Tidal, Close button for others */}
        {selectedSource === 'tidal' && tidalEnabled ? (
          <Pressable
            onPress={handleManualSearch}
            style={{
              backgroundColor: colors.primary,
              height:43,
              justifyContent:"center",
              width:43,
              borderRadius:100000,
              elevation:10,
              alignItems:"center",
            }}
          >
            <Entypo name={"magnifying-glass"} size={width * 0.045} color={"white"}/>
          </Pressable>
        ) : (
          <Pressable onPress={()=>{
            navigation.goBack()
          }} style={{
            backgroundColor:"white",
            height:43,
            justifyContent:"center",
            width:43,
            borderRadius:100000,
            elevation:10,
            alignItems:"center",
          }}>
            <Entypo name={"cross"} size={width * 0.045} color={"black"}/>
          </Pressable>
        )}
      </View>

      <Tabs tabs={["Songs","Playlists","Albums","Artists"]} setState={setActiveTab} state={ActiveTab}/>

      {/* Source Switcher - Only show for Songs tab and when Tidal is enabled */}
      {ActiveTab === 0 && tidalEnabled && (
        <View style={{
          flexDirection: 'column',
          alignItems: 'center',
          marginVertical: 10,
          paddingHorizontal: 10,
        }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.card,
            borderRadius: 25,
            padding: 3,
          }}>
            <TouchableOpacity
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedSource === 'saavn' ? colors.primary : 'transparent',
              }}
              onPress={() => setSelectedSource('saavn')}
            >
              <PlainText
                text="Saavn"
                style={{
                  color: selectedSource === 'saavn' ? 'white' : colors.text,
                  fontWeight: selectedSource === 'saavn' ? 'bold' : 'normal'
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedSource === 'tidal' ? colors.primary : 'transparent',
              }}
              onPress={() => setSelectedSource('tidal')}
            >
              <PlainText
                text="Tidal"
                style={{
                  color: selectedSource === 'tidal' ? 'white' : colors.text,
                  fontWeight: selectedSource === 'tidal' ? 'bold' : 'normal'
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Tidal search hint */}
          {selectedSource === 'tidal' && (
            <PlainText
              text="Press Enter to search • LOSSLESS quality only"
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 5,
                textAlign: 'center'
              }}
            />
          )}
        </View>
      )}

      <Spacer height={15}/>
      {Loading && <LoadingComponent loading={Loading}/>}
      {!Loading && <View style={{
        paddingHorizontal:10,
      }}>
          {ActiveTab === 0 && !Loading && <SongDisplay data={Data} limit={limit} Searchtext={SearchText} source={selectedSource}/>}
          {ActiveTab === 1 && !Loading && <PlaylistDisplay data={Data} limit={limit} Searchtext={SearchText}/>}
          {ActiveTab === 2 && !Loading && <AlbumsDisplay data={Data} limit={limit} Searchtext={SearchText}/>}
          {ActiveTab === 3 && !Loading && <ArtistDisplay data={Data} limit={limit} Searchtext={SearchText}/>}
      </View>}
    </MainWrapper>
  );
};
