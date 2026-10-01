import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const StoreDataSlice = createSlice({
    name:"StoreData",
    initialState:{
        category:[],
        products:[],
    },
    reducers:{
        setCategory:(state,action)=>{
            state.category=action.payload
        },
        setProduct:(state,action)=>{
            state.products=action.payload
        }
    }
})
export const {setCategory,setProduct} =StoreDataSlice.actions

const api_url= import.meta.env.VITE_API_URL
export const fetchCategory =()=>async(dispatch)=>{
    try {
        const res = await axios.get(`${api_url}/api/category/all-category`)
        // console.log(res);
        const categoryData = res.data.category
        dispatch(setCategory(categoryData))
    } catch (error) {
        console.log(error);
        
    }
}
export const fetchProduct =()=>async(dispatch)=>{
    try {
        const res = await axios.get(`${api_url}/api/product/get-all`)
        console.log(res);
        const productData = res.data.product
        dispatch(setProduct(productData))
    } catch (error) {
        console.log(error);
        
    }
}
export default StoreDataSlice.reducer;