import { OnDestroy, OnInit } from "@angular/core";
import { Component } from "@angular/core";
import { PageEvent } from "@angular/material";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/auth/auth.service";
import { environment } from 'src/environments/environment';

import { Post } from "../posts.model";
import { PostsService } from "../posts.service";

@Component({
  selector: "app-post-list",
  templateUrl: "./post-list.component.html",
  styleUrls: ["./post-list.component.css"]
})
export class PostListComponent implements OnInit, OnDestroy {

  totalPosts: number;
  postsPerPage = 2;
  currentPage = 1;
  postsOptions = [1, 2, 5, 10];
  posts:Post[] = [];
  postSubs: Subscription;
  userIsAuthenticated: boolean = false;
  userId: string;
  private authStatusSub: Subscription;
  isLoading = false;
  constructor(public postService: PostsService, private authService: AuthService) {}

  ngOnInit(){
    console.log(environment.apiUrl);
    this.isLoading = true;
    this.postService.getPosts(this.postsPerPage, this.currentPage);
    this.userId = this.authService.getUserId();
    this.postSubs = this.postService.getPostsUpdatedListener().
    subscribe((postsUpdatedData:{ posts: Post[], postCount: number }) => {
      this.isLoading = false;
      this.posts = postsUpdatedData.posts;
      this.totalPosts = postsUpdatedData.postCount;
    });

    this.userIsAuthenticated = this.authService.getAuthStatus();
    this.authStatusSub = this.authService.getAuthListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      });
  }

  onChangedPage(pageData: PageEvent){
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.postsPerPage = pageData.pageSize;
    this.postService.getPosts(this.postsPerPage, this.currentPage);
  }

  onDelete(postId:string){
    this.postService.deletePost(postId).subscribe(() => {
      this.postService.getPosts(this.postsPerPage, this.currentPage);
    }, () => {
      this.isLoading = false;
    });
  }

  ngOnDestroy(){
    this.postSubs.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
