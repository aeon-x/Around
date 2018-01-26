import React from 'react';
import { Tabs, Button } from 'antd';
import { GEO_OPTIONS ,POS_KEY, TOKEN_KEY, AUTH_PREFIX, API_ROOT } from '../constants';
import { Spin } from 'antd';
import $ from 'jquery';
import {Gallery} from "./Gallery";
import { CreatePostButton } from "./CreatePostButton";


const TabPane = Tabs.TabPane;


export class Home extends React.Component {

    state = {
        loadingGeolocation: false,
        loadingPosts: false,
        error: '',
        posts: [],
    }

    componentDidMount() {
        this.setState({ loadingGeolocation:true, error: '' });
        this.getGeoLocation();
    }

    getGeoLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                this.onSuccessLoadGeoLocation,
                this.onFailedLoadGeoLocation,
                GEO_OPTIONS
            );
        } else {
            this.setState({error: "not support geolocation" });
        }
    }

    onSuccessLoadGeoLocation = (position) => {
        console.log(position);
        this.setState({ loadingGeolocation:false, error: '' });
        const { latitude: lat, longitude: lon } = position.coords;
        localStorage.setItem('POS_KEY', JSON.stringify({lat: lat, lon:lon}));
        this.loadNearbyPosts();
    }

    onFailedLoadGeoLocation = () => {
        this.setState({ loadingGeolocation:false, error: 'failed geolocation' });
    }

    getGalleryPanelContent = () => {
        if (this.state.error) {
            return <div>{this.state.error}</div>;
        } else if (this.state.loadingGeolocation) {
            <Spin tip="Loading Geo location..."/> ;
        } else if (this.state.loadingPosts) {
            return <Spin tip="Loading posts ..."/>
        } else if (this.state.posts) {
            const images = this.state.posts.map((post) => {
                return {
                    user: post.user,
                    src: post.url,
                    thumbnail: post.url,
                    thumbnailWidth: 400,
                    thumbnailHeight: 300,
                    caption: post.message,
                };
            });
            return (
                <Gallery
                    images={images}
                />
            );
        }
        return null;
    }

    loadNearbyPosts = (location, radius) => {
        const { lat, lon } = location ? location : JSON.parse(localStorage.getItem(POS_KEY));
        const range = radius ? radius : 20;
        this.setState({ loadingPosts: true });
        return $.ajax({
            url: `${API_ROOT}/search?lat=${lat}&lon=${lon}&range=${range}`,
            method: 'GET',
            headers: {
                Authorization: `${AUTH_PREFIX} ${localStorage.getItem(TOKEN_KEY)}`
            },
        }).then((response) => {
            console.log(response);
            this.setState({ posts: response, loadingPosts: false, error: '' });
        }, (error) => {
            this.setState({ loadingPosts: false, error: error.responseText });
        }).catch((error) => {
            this.setState({ error: error });
        });
    }

    render() {
        const createPostButton = <CreatePostButton loadNearbyPosts = {this.loadNearbyPosts}/>;

        return (
                <Tabs tabBarExtraContent={createPostButton} className="main-tabs">
                    <TabPane tab="Posts" key="1">
                        {this.getGalleryPanelContent()
                        }
                    </TabPane>
                    <TabPane tab="Map" key="2">Content of tab 2</TabPane>
                </Tabs>
        );
    }
}
