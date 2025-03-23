/* eslint-disable keyword-spacing */
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, View, BackHandler, ActivityIndicator, Pressable } from "react-native";
import { LoadingComponent } from "../Global/Loading";
import { EachPlaylistCard } from "../Global/EachPlaylistCard";
import { PlainText } from "../Global/PlainText";
import { SmallText } from "../Global/SmallText";
import { getSearchPlaylistData } from "../../Api/Playlist";
import { Heading } from "../Global/Heading";
import { PaddingConatiner } from "../../Layout/PaddingConatiner";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function ShowPlaylistofType({route}) {
  const {Searchtext = 'most searched'} = route?.params || {}; // Provide default value
  const navigation = useNavigation();
  const limit = 30;
  const [Data, setData] = useState({});
  const [Loading, setLoading] = useState(true);
  const [isRendered, setIsRendered] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  // Force refresh when screen is focused (coming back from playlist)
  useFocusEffect(
    React.useCallback(() => {
      console.log('ShowPlaylistofType focused with search term:', Searchtext);
      // Reset error state when focused
      setFetchError(null);
      
      // Always force a refresh when the screen is focused
      setLoading(true);
      setIsRendered(true);
      addSearchData();
      
      return () => {
        // Clean up here if needed
      };
    }, [Searchtext]) // Depend on Searchtext to refresh when it changes
  );
  
  // Add back handler for hardware back button
  useEffect(() => {
    const handleBackPress = () => {
      console.log('Back pressed in ShowPlaylistofType, navigating to Discover');
      
      // Reset the Discover tab stack and navigate to DiscoverPage
      navigation.reset({
        index: 0,
        routes: [{ name: 'DiscoverPage' }],
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, [navigation]);
  
  async function addSearchData(){
    // Always try to fetch data, even with empty search text
    try {
      setLoading(true);
      console.log(`Fetching playlist data for search: ${Searchtext}`);
      const fetchdata = await getSearchPlaylistData(Searchtext || 'most searched', 1, limit);
      if (fetchdata?.data?.results) {
        setData(fetchdata);
        setFetchError(null);
      } else {
        console.log("No results or invalid data structure:", fetchdata);
        setFetchError("Failed to load playlist data");
      }
    } catch (e) {
      console.log("Error fetching search data:", e);
      setFetchError(e.message || "An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    if (!isRendered) {
      addSearchData();
    }
  }, []);

  const width = Dimensions.get("window").width
  return (
    <>
      <PaddingConatiner>
        <Heading text={(Searchtext || 'Popular Playlists').toUpperCase()}/>
      </PaddingConatiner>
      
      {/* Improved loading state */}
      {Loading && (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          height: 300
        }}>
          <ActivityIndicator size="large" color="#1DB954" />
          <PlainText text={`Loading ${Searchtext || 'playlist'} data...`} style={{marginTop: 10}} />
        </View>
      )}
      
      {/* Error state */}
      {fetchError && !Loading && (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          height: 300,
          paddingHorizontal: 20
        }}>
          <PlainText text={fetchError} style={{marginBottom: 10, textAlign: 'center'}} />
          <Pressable 
            onPress={addSearchData}
            style={{
              padding: 10, 
              backgroundColor: '#1DB954', 
              borderRadius: 5,
              marginTop: 10
            }}
          >
            <PlainText text="Retry" style={{color: 'white'}} />
          </Pressable>
        </View>
      )}
      
      {!Loading && !fetchError && (
        <>
          {Data?.data?.results?.length > 0 ? (
            <FlatList 
              showsVerticalScrollIndicator={false}
              numColumns={2}
              keyExtractor={(item, index) => String(index)}
              contentContainerStyle={{
                paddingBottom: 100,
                alignItems: "flex-start",
              }}
              data={Data?.data?.results}
              renderItem={(item) => (
                <EachPlaylistCard
                  name={item.item.name}
                  follower={"Total " + item.item.songCount + " Songs"}
                  key={item.index}
                  image={item.item.image[2].link}
                  id={item.item.id}
                  source="ShowPlaylistofType"
                  searchText={Searchtext}
                  MainContainerStyle={{
                    width: width * 0.45,
                    marginHorizontal: 10,
                  }}
                  ImageStyle={{
                    height: "70%",
                  }}
                />
              )}
            />
          ) : (
            <View style={{
              height: 400,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <PlainText text={"No Playlists Found"}/>
              <SmallText text={"Try searching for something else"}/>
            </View>
          )}
        </>
      )}
    </>
  );
}
