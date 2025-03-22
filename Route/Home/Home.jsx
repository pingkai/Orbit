import { MainWrapper } from "../../Layout/MainWrapper";
import { FlatList, ScrollView, View, Text, RefreshControl } from "react-native";
import { Heading } from "../../Component/Global/Heading";
import { HorizontalScrollSongs } from "../../Component/Global/HorizontalScrollSongs";
import { RouteHeading } from "../../Component/Home/RouteHeading";
import { PaddingConatiner } from "../../Layout/PaddingConatiner";
import { EachAlbumCard } from "../../Component/Global/EachAlbumCard";
import { RenderTopCharts } from "../../Component/Home/RenderTopCharts";
import { LoadingComponent } from "../../Component/Global/Loading";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getHomePageData } from "../../Api/HomePage";
import { EachPlaylistCard } from "../../Component/Global/EachPlaylistCard";
import { GetLanguageValue } from "../../LocalStorage/Languages";
import { TopHeader } from "../../Component/Home/TopHeader";
import { DisplayTopGenres } from "../../Component/Home/DisplayTopGenres";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Helper function to shuffle array
const shuffleArray = (array) => {
  if (!array || !Array.isArray(array)) return [];
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const Home = () => {
  const [Loading, setLoading] = useState(true);
  const [Data, setData] = useState({ data: { charts: [], playlists: [], trending: { albums: [] } } });
  const [refreshing, setRefreshing] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [chartIndices, setChartIndices] = useState([0, 1, 2, 3]); // Dynamic chart indices

  // Get random chart indices
  const randomizeCharts = useCallback((charts) => {
    if (!charts || charts.length === 0) return;
    
    // Create a shuffled array of indices
    const indices = Array.from({ length: charts.length }, (_, i) => i);
    setChartIndices(shuffleArray(indices).slice(0, 4)); // Take the first 4 shuffled indices
    
    console.log('Randomized chart indices:', chartIndices);
  }, []);

  async function fetchHomePageData(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        setLoading(true);
      }
      
      const networkState = await NetInfo.fetch();
      setIsOffline(!networkState.isConnected);

      // Try to load cached data first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem('homePageData');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setData(parsedData);
          // Randomize chart indices with the cached data
          randomizeCharts(parsedData?.data?.charts);
        }
      }

      if (networkState.isConnected) {
        const Languages = await GetLanguageValue();
        const data = await getHomePageData(Languages);
        setData(data);
        
        // Randomize chart indices with the new data
        randomizeCharts(data?.data?.charts);
        
        // Cache the new data
        await AsyncStorage.setItem('homePageData', JSON.stringify(data));
      }
    } catch (e) {
      console.log('Error fetching data:', e);
      // If there's an error and we're offline, we'll continue with cached data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  
  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomePageData(true);
  }, []);

  useEffect(() => {
    fetchHomePageData();
  }, []);

  // Shuffle playlists and albums for more variety
  const shuffledPlaylists = useMemo(() => 
    shuffleArray(Data?.data?.playlists || []),
  [Data?.data?.playlists]);
  
  const shuffledAlbums = useMemo(() => 
    shuffleArray(Data?.data?.trending?.albums || []),
  [Data?.data?.trending?.albums]);

  // Get a chart ID safely
  const getChartId = (index) => {
    if (!Data?.data?.charts || !chartIndices || chartIndices.length <= index) {
      return null;
    }
    return Data?.data?.charts[chartIndices[index]]?.id;
  };

  return (
    <MainWrapper>
      <LoadingComponent loading={Loading}/>
      {
        !Loading &&  <View>
          <ScrollView 
            style={{zIndex:-1}} 
            onScroll={(e)=>{
              if (e.nativeEvent.contentOffset.y > 200 && !showHeader){
                setShowHeader(true)
              } else if (e.nativeEvent.contentOffset.y < 200 && showHeader) {
                setShowHeader(false)
              }
            }} 
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1DB954']}
                tintColor={'#1DB954'}
              />
            }
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{
              paddingBottom:90,
            }}
          >
            <RouteHeading showSearch={true} showSettings={true}/>

            <DisplayTopGenres/>
            <PaddingConatiner>
              <HorizontalScrollSongs id={getChartId(0)}/>
              <Heading text={"Recommended"}/>
            </PaddingConatiner>
            <FlatList
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 13,
                gap: 15,
              }}
              data={shuffledPlaylists}
              keyExtractor={(item, index) => `playlist-${item.id}-${index}`}
              renderItem={({ item, index }) => (
                <EachPlaylistCard
                  name={item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title}
                  follower={item.subtitle.length > 20 ? item.subtitle.substring(0, 20) + '...' : item.subtitle}
                  key={index}
                  image={item.image[2].link}
                  id={item.id}
                />
              )}
            />
            <PaddingConatiner>
              <Heading text={"Trending Albums"}/>
            </PaddingConatiner>
            <FlatList
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 13,
              }}
              data={shuffledAlbums}
              keyExtractor={(item, index) => `album-${item.id}-${index}`}
              renderItem={({ item, index }) => (
                <EachAlbumCard
                  image={item.image[2].link}
                  artists={item.artists}
                  key={index}
                  name={item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
                  id={item.id}
                />
              )}
            />
            <PaddingConatiner>
              <HorizontalScrollSongs id={getChartId(1)}/>
            {isOffline && (
              <PaddingConatiner>
                <Text style={{
                  color: '#666',
                  textAlign: 'center',
                  marginTop: 10,
                  marginBottom: 10
                }}>
                  You're offline. Some content may not be available.
                </Text>
              </PaddingConatiner>
            )}
            </PaddingConatiner>
            <PaddingConatiner>
              <Heading text={"Top Charts"}/>
            </PaddingConatiner>
            <FlatList 
              horizontal={true} 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{
                paddingLeft:13,
              }}  
              data={[1]} 
              renderItem={()=><RenderTopCharts playlist={Data.data.charts}/>}
              keyExtractor={() => 'top-charts'}
            />
            <PaddingConatiner>
              <HorizontalScrollSongs id={getChartId(2)}/>
            </PaddingConatiner>
            <PaddingConatiner>
              <HorizontalScrollSongs id={getChartId(3)}/>
            </PaddingConatiner>
          </ScrollView>
          <TopHeader showHeader={showHeader}/>
        </View>
      }
    </MainWrapper>
  );
};

