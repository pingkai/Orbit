/* eslint-disable keyword-spacing */
import React, { useState, useEffect } from 'react'
import { Dimensions, FlatList, View } from 'react-native'
import { getSearchArtistData } from '../../Api/Songs'
import { LoadingComponent } from '../Global/Loading'
import { PlainText } from '../Global/PlainText'
import { SmallText } from '../Global/SmallText'
import { EachArtistCard } from '../Global/EachArtistCard'

export default function ArtistDisplay({data, limit, Searchtext}) {
  const [Data, setData] = useState(data)
  const totalPages = Math.ceil(Data?.data?.total ?? 1 / limit)
  const [Page, setPage] = useState(1)
  const [Loading, setLoading] = useState(false)
  
  // Update data when props change
  useEffect(() => {
    setData(data);
  }, [data]);

  async function fetchSearchData(text,page){
   if (Page <= totalPages){
   if(Searchtext !== ""){
    try {
        setLoading(true)
        const fetchdata = await getSearchArtistData(text,page,limit)
        
        // Check if fetchdata has valid structure
        if (fetchdata && fetchdata.data && fetchdata.data.results) {
          const temp = Data
          if (temp && temp.data && temp.data.results) {
            const finalData = [...temp.data.results, ...fetchdata.data.results]
            temp.data.results = finalData
            setData(temp)
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false)
      }
   }
   }
  }
  const width = Dimensions.get("window").width

  return (
    <View>
      {Data?.data?.results?.length !== 0 && <FlatList 
        showsVerticalScrollIndicator={false} 
        keyExtractor={(item, index) => String(index)} 
        onEndReached={()=>{
          setTimeout(()=>{
            setPage(Page + 1)
            fetchSearchData(Searchtext, Page)
          },200)
        }} 
        contentContainerStyle={{
          paddingBottom:220,
        }} 
        data={[...Data?.data?.results ?? [], {LoadingComponent:true}]} 
        renderItem={(item)=>{
          if(item.item.LoadingComponent === true){
              return <LoadingComponent loading={Loading} height={100}/>
          }else{
              return <EachArtistCard  
                id={item.item?.id} 
                width={width * 0.95} 
                name={item.item?.name} 
                role={item.item?.role}
                image={item?.item?.image[2]?.url ?? item?.item?.image[0]?.url ?? ""} 
                url={item.item?.url}
                style={{
                  marginBottom: 13,
                }}
              />
            }
          }}
      />}
      {Data?.data?.results?.length === 0 && <View style={{
        height:400,
        alignItems:"center",
        justifyContent:"center",
      }}>
        <PlainText text={"No Artist found!"}/>
        <SmallText text={"Opps!  T_T"}/>
        </View> }
     </View>
  )
}
