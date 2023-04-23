import xmlbuilder from 'xmlbuilder';
import moment from 'moment';
import { getPostsBytitleID } from '@/database';
import { XMLResponseGeneratorOptions } from '@/types/common/xml-response-generator-options';
import { HydratedPostDocument } from '@/types/mongoose/post';
import { HydratedCommunityDocument } from '@/types/mongoose/community';
import { HydratedSettingsDocument } from '@/types/mongoose/settings';

class XmlResponseGenerator {
	static RepliesResponse(posts: HydratedPostDocument[], options: XMLResponseGeneratorOptions): string {
		const xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('request_name', 'replies').up()
			.e('posts');

		for (const post of posts) {
			postObj(xml, post, options, null);
		}

		return xml.up().end({ pretty: true, allowEmpty: true });
	}

	static PostsResponse(posts: HydratedPostDocument[], community: HydratedCommunityDocument, options: XMLResponseGeneratorOptions): string {
		const xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('request_name', options.name).up()
			.e('topic')
			.e('community_id', community.community_id).up()
			.up()
			.e('posts');

		for (const post of posts) {
			postObj(xml, post, options, null);
		}

		return xml.up().end({ pretty: true, allowEmpty: true });
	}

	static EmptyResponse(): string {
		const xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up();

		return xml.end({ pretty: true, allowEmpty: true });
	}

	static Communities(communities: HydratedCommunityDocument[]): string {
		let xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('request_name', 'communities').up()
			.e('communities');

		for (const community of communities) {
			xml = xml.e('community')
				.e('community_id', community.community_id).up()
				.e('name', community.name).up()
				.e('description', community.description).up()
				.e('icon').up()
				.e('icon_3ds').up()
				.e('pid').up()
				.e('app_data', community.app_data).up()
				.e('is_user_community', 0).up()
				.up();
		}

		return xml.up().end({ pretty: true, allowEmpty: true });
	}

	static Community(community: HydratedCommunityDocument): string {
		const xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('request_name', 'community').up()
			.e('community')
			.e('community_id', community.community_id).up()
			.e('name', community.name).up()
			.e('description', community.description).up()
			.e('icon').up()
			.e('icon_3ds').up()
			.e('pid').up()
			.e('app_data', community.app_data).up()
			.e('is_user_community', 0)
			.up();

		return xml.up().end({ pretty: true, allowEmpty: true });
	}

	static SinglePostResponse(post: HydratedPostDocument): string {
		const xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('post');

		const options: XMLResponseGeneratorOptions = {
			with_mii: true
		};

		postObj(xml, post, options, null);

		return xml.up().end({ pretty: true, allowEmpty: true });
	}

	static QueryResponse(post: HydratedPostDocument): string {
		const xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('request_name', 'posts.search').up()
			.e('posts');

		const options: XMLResponseGeneratorOptions = {
			with_mii: true
		};

		postObj(xml, post, options, null);

		return  xml.up().end({ pretty: true, allowEmpty: true });
	}

	/**
     * Generate response to /v1/topics
     * @param communities
     * @returns xml
     */
	static async topics(communities: HydratedCommunityDocument[]): Promise<string> {
		const expirationDate = moment().add(1, 'days');

		let xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('request_name', 'topics').up()
			.e('expire', expirationDate.format('YYYY-MM-DD HH:MM:SS')).up()
			.e('topics');

		for (const community of communities) {
			const posts = await getPostsBytitleID(community.title_id, 30);

			xml = xml.e('topic')
				.e('empathy_count', community.empathy_count).up()
				.e('has_shop_page', community.has_shop_page).up()
				.e('icon', community.icon).up()
				.e('title_ids');

			community.title_id.forEach(function (title_id: string) {
				if (title_id !== '') {
					xml = xml.e('title_id', title_id).up();
				}
			});

			xml = xml.up()
				.e('title_id', community.title_id[0]).up()
				.e('community_id', community.community_id).up()
				.e('is_recommended', community.is_recommended).up()
				.e('name', community.name).up()
				.e('people');

			for (const post of posts) {
				xml = xml.e('person').e('posts');

				const options: XMLResponseGeneratorOptions = { with_mii: true,
					app_data: false,
					topic_tag: false,
					topics: true
				};

				postObj(xml, post, options, community);
				xml = xml.up().up();
			}

			xml = xml.up().up();
		}

		return xml.end({ pretty: false, allowEmpty: true });
	}

	static Following(people: HydratedSettingsDocument[]): string {
		let xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('request_name', 'user_infos').up()
			.e('people');

		for (const person of people) {
			xml = xml.e('person')
				.e('pid', person.pid).up()
				.e('screen_name', person.screen_name).up()
				.up();
		}

		return xml.up().end({ pretty: true, allowEmpty: true });
	}

	static People(posts: HydratedPostDocument[], options: XMLResponseGeneratorOptions): string {
		const expirationDate = moment().add(1, 'days');

		let xml: xmlbuilder.XMLElement = xmlbuilder.create('result', { encoding: 'UTF-8' })
			.e('has_error', '0').up()
			.e('version', '1').up()
			.e('expire', expirationDate.format('YYYY-MM-DD HH:MM:SS')).up()
			.e('request_name', options.name).up()
			.e('people');

		for (const post of posts) {
			xml = xml.e('person').e('posts');

			postObj(xml, post, options, null);

			xml = xml.up().up();
		}

		return xml.up().end({ pretty: true, allowEmpty: true });
	}
}

function postObj(xml: xmlbuilder.XMLElement, post: HydratedPostDocument, options: XMLResponseGeneratorOptions, community: HydratedCommunityDocument | null): void {
	xml = xml.e('post');

	if (post.app_data && options.app_data) {
		xml.e('app_data', post.app_data.replace(/[^A-Za-z0-9+/=]/g, '').replace(/[\n\r]+/gm, '').trim()).up();
	}

	xml.e('body', post.body ? post.body.replace(/[^A-Za-z\d\s-_!@#$%^&*(){}+=,.<>/?;:'"[\]]/g, '').replace(/[\n\r]+/gm, '') : '').up();

	if (options.topics && community) {
		xml.e('community_id', community.community_id).up();
	} else {
		xml.e('community_id', post.community_id).up();
	}

	xml.e('country_id', post.country_id ? post.country_id : 254).up()
		.e('created_at', moment(post.created_at).format('YYYY-MM-DD HH:MM:SS')).up()
		.e('feeling_id', post.feeling_id).up()
		.e('id', post.id).up()
		.e('is_autopost', post.is_autopost).up()
		.e('is_community_private_autopost', post.is_community_private_autopost).up()
		.e('is_spoiler', post.is_spoiler).up()
		.e('is_app_jumpable', post.is_app_jumpable).up()
		.e('empathy_count', post.empathy_count).up()
		.e('language_id', post.language_id).up();

	if (options.with_mii) {
		xml.e('mii', post.mii.replace(/[^A-Za-z0-9+/=]/g, '').replace(/[\n\r]+/gm, '').trim()).up()
			.e('mii_face_url', post.mii_face_url).up();
	}

	xml.e('number', '0').up();

	if (post.painting) {
		xml.e('painting')
			.e('format', 'tga').up()
			.e('content', post.painting.replace(/[\n\r]+/gm, '').trim()).up()
			.e('size', post.painting.length).up()
			.e('url', `https://pretendo-cdn.b-cdn.net/paintings/${post.pid}/${post.id}.png`).up()
			.up();
	}

	xml.e('pid', post.pid).up()
		.e('platform_id', post.platform_id).up()
		.e('region_id', post.region_id).up()
		.e('reply_count', post.reply_count).up()
		.e('screen_name', post.screen_name).up();

	if (post.screenshot && post.screenshot_length) {
		xml.e('screenshot')
			.e('size', post.screenshot_length).up()
			.e('url', `https://pretendo-cdn.b-cdn.net/screenshots/${post.pid}/${post.id}.jpg`).up()
			.up();
	}

	if (post.topic_tag && options.topic_tag) {
		xml.e('topic_tag')
			.e('name', post.topic_tag).up()
			.e('title_id', post.title_id).up()
			.up();
	}

	xml.e('title_id', post.title_id).up().up();
}

export default XmlResponseGenerator;
