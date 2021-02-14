import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, NgForm, Validators } from "@angular/forms";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/auth/auth.service";
import { Post } from "../posts.model";

import { PostsService } from "../posts.service";
import { mimeType } from "./mime-type.validator";

@Component({
  selector: "app-post-create",
  templateUrl: "./post-create.component.html",
  styleUrls: ["./post-create.component.css"]
})
export class PostCreateComponent implements OnInit, OnDestroy{

  private mode = 'create';
  private authStatusSubs: Subscription;
  private postId: string;
  imagePreview: string;
  post: Post;
  button = 'Add';
  isLoading = false;
  form: FormGroup;

  constructor(public postService: PostsService, public route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(){
    this.authStatusSubs = this.authService.getAuthListener().subscribe(
      authData => {
        this.isLoading = false;
      }
    );
    this.form = new FormGroup({
      'title': new FormControl(null, {
        validators: [Validators.required, Validators.minLength(3)]
      }),
      'content': new FormControl(null, {
        validators: [Validators.required]
      }),
      'image': new FormControl(null, {
        validators: [Validators.required],
        asyncValidators: [mimeType]
      })
    });
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if(paramMap.has('postId')) {
        this.mode = 'edit';
        this.postId = paramMap.get('postId');
        this.postService.getPost(this.postId).subscribe(post => {
          this.post = {
            id: post._id,
            title: post.title,
            content: post.content,
            imagePath: post.imagePath,
            creator: null
          };
          this.form.setValue({
            'title': this.post.title,
            'content': this.post.content,
            'image': this.post.imagePath
          });
        });
        this.button = 'Update';
      } else {
        this.mode = 'create';
        this.postId = undefined;
        this.button = 'Add';
      }
    });
  }

  onUpload(event: Event){
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({'image': file});
    this.form.get('image').updateValueAndValidity();

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSavePost() {
    if(this.form.invalid){
      return;
    }
    this.isLoading = true;
    if(this.mode === 'create'){
      this.postService.addPost(this.form.value.title, this.form.value.content, this.form.value.image);
    } else {
      this.postService.updatePost(this.postId, this.form.value.title, this.form.value.content, this.form.value.image);
    }
    this.form.reset();
  }

  ngOnDestroy(){
    this.authStatusSubs.unsubscribe();
  }
}
